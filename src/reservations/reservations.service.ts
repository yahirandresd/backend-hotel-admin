import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { HuespedReservacion } from './entities/huesped-reservacion.entity';
import { ReservacionServicio } from './entities/reservacion-servicio.entity';
import { Guest } from '../guests/entities/guest.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { ActividadEvento } from '../actividades/entities/actividad-evento.entity';
import { ReservacionActividad } from '../actividades/entities/reservacion-actividad.entity';
import { Plan } from '../planes/entities/plan.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { GuestsService } from '../guests/guests.service';
import { ReservationLinksService } from '../reservation-links/reservation-links.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { toReservationResponse } from './dto/reservation-response.dto';
import {
  UpdateEstadoDto,
  AsignarHabitacionDto,
  AgregarServicioDto,
  AgregarActividadDto,
  AsignarPlanDto,
  UpdateReservationAdminDto,
} from './dto/admin-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(HuespedReservacion)
    private readonly huespedReservacionRepo: Repository<HuespedReservacion>,

    @InjectRepository(Habitacion)
    private readonly habitacionRepo: Repository<Habitacion>,

    @InjectRepository(Servicio)
    private readonly servicioRepo: Repository<Servicio>,

    @InjectRepository(ActividadEvento)
    private readonly eventoRepo: Repository<ActividadEvento>,

    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,

    @InjectRepository(ReservacionServicio)
    private readonly reservacionServicioRepo: Repository<ReservacionServicio>,

    @InjectRepository(ReservacionActividad)
    private readonly reservacionActividadRepo: Repository<ReservacionActividad>,

    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,

    private readonly guestsService: GuestsService,
    private readonly linksService: ReservationLinksService,
  ) {}

  // ── Crear (cliente) ───────────────────────────────────────────────────────

  async create(dto: CreateReservationDto, code: string): Promise<Reservation> {
    await this.linksService.validate(code);
    this.validateDates(dto.fechaIngreso, dto.fechaSalida);

    if (!dto.aceptaTerminos) {
      throw new BadRequestException('Debe aceptar los términos y condiciones');
    }

    const reservation = this.reservationRepository.create({
      titularDocNum: dto.docNum,
      fechaIngreso: dto.fechaIngreso,
      fechaSalida: dto.fechaSalida,
      motivo: dto.motivo,
      aceptaTerminos: dto.aceptaTerminos,
      canalOrigen: dto.canalOrigen ?? 'web',
      notas: dto.notas,
      estado: 'pendiente',
      precioTotal: 0,
    });

    const titular = this.guestsService.buildTitular(dto);
    const acompanantes = this.guestsService.buildAcompanantes(dto.guests ?? []);
    reservation.guests = [titular, ...acompanantes];

    const saved = await this.reservationRepository.save(reservation);
    await this.linksService.markAsUsed(code, saved.id);

    return saved;
  }

  // ── Listar todos ──────────────────────────────────────────────────────────

  async findAll(): Promise<Reservation[]> {
    return this.reservationRepository.find({
      relations: { guests: true },
      order: {
        createdAt: 'DESC',
        guests: { esTitular: 'DESC' },
      },
    });
  }

  // ── Obtener uno ───────────────────────────────────────────────────────────

  async findOne(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: { guests: true, pagos: true, plan: true },
      order: { guests: { esTitular: 'DESC' } },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva #${id} no encontrada`);
    }

    return reservation;
  }

  // ── Actualizar (admin) ────────────────────────────────────────────────────

  async update(id: number, dto: UpdateReservationDto): Promise<Reservation> {
    const reservation = await this.findOne(id);

    if (dto.fechaIngreso || dto.fechaSalida) {
      this.validateDates(
        dto.fechaIngreso ?? reservation.fechaIngreso,
        dto.fechaSalida ?? reservation.fechaSalida,
      );
    }

    Object.assign(reservation, dto);
    return this.reservationRepository.save(reservation);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async remove(id: number): Promise<void> {
    const reservation = await this.findOne(id);
    await this.reservationRepository.remove(reservation);
  }

  // ── Cambiar estado ────────────────────────────────────────────────────────

  async updateEstado(id: number, dto: UpdateEstadoDto): Promise<Reservation> {
    const reservation = await this.findOne(id);
    reservation.estado = dto.estado;
    if (dto.notas) reservation.notas = dto.notas;

    const asignaciones = await this.huespedReservacionRepo.find({
      where: { reservacionId: id },
    });
    const habitacionIds = asignaciones
      .map((a) => a.habitacionId)
      .filter((hid): hid is number => !!hid);

    if (dto.estado === 'check_in') {
      for (const hid of habitacionIds) {
        await this.habitacionRepo.update(hid, { estado: 'ocupada' });
      }
    }

    if (dto.estado === 'check_out' || dto.estado === 'cancelada') {
      for (const hid of habitacionIds) {
        await this.habitacionRepo.update(hid, { estado: 'disponible' });
      }
    }

    return this.reservationRepository.save(reservation);
  }

  // ── Asignar habitación a huésped ──────────────────────────────────────────

  async asignarHabitacion(
    id: number,
    dto: AsignarHabitacionDto,
  ): Promise<HuespedReservacion> {
    const reservation = await this.findOne(id);

    const guest = reservation.guests.find((g) => g.id === dto.guestId);
    if (!guest) {
      throw new NotFoundException(
        `Huésped #${dto.guestId} no pertenece a esta reserva`,
      );
    }

    const habitacion = await this.habitacionRepo.findOne({
      where: { id: dto.habitacionId },
      relations: { tipo: true },
    });
    if (!habitacion) {
      throw new NotFoundException(
        `Habitación #${dto.habitacionId} no encontrada`,
      );
    }
    if (habitacion.estado !== 'disponible') {
      throw new BadRequestException(
        `La habitación ${habitacion.numero} no está disponible`,
      );
    }

    // Verificar si ya tiene asignación en esta reservación
    const existente = await this.huespedReservacionRepo.findOne({
      where: { reservacionId: id, guestId: dto.guestId },
    });

    const precioNoche = Number(habitacion.tipo.precioBase);

    if (existente) {
      if (
        existente.habitacionId &&
        existente.habitacionId !== dto.habitacionId
      ) {
        await this.habitacionRepo.update(existente.habitacionId, {
          estado: 'disponible',
        });
      }
      existente.habitacionId = dto.habitacionId;
      existente.precioNoche = precioNoche;
      await this.huespedReservacionRepo.save(existente);
    } else {
      const asignacion = this.huespedReservacionRepo.create({
        guestId: dto.guestId,
        reservacionId: id,
        habitacionId: dto.habitacionId,
        esTitular: guest.esTitular,
        precioNoche,
      });
      await this.huespedReservacionRepo.save(asignacion);
    }

    const asignacion = await this.huespedReservacionRepo.findOne({
      where: { reservacionId: id, guestId: dto.guestId },
      relations: { habitacion: true },
    });

    if (!asignacion) {
      throw new NotFoundException('Asignación no encontrada');
    }

    return asignacion;
  }

  // ── Desasignar habitación de un huésped ───────────────────────────────────

  async desasignarHabitacion(reservacionId: number, guestId: number): Promise<void> {
    const asignacion = await this.huespedReservacionRepo.findOne({
      where: { reservacionId, guestId },
    });

    if (!asignacion) {
      throw new NotFoundException(
        `No hay habitación asignada al huésped #${guestId} en esta reserva`,
      );
    }

    if (asignacion.habitacionId) {
      await this.habitacionRepo.update(asignacion.habitacionId, { estado: 'disponible' });
    }

    await this.huespedReservacionRepo.remove(asignacion);
  }

  // ── Ver asignaciones de habitaciones ──────────────────────────────────────

  async findAsignaciones(reservacionId: number) {
    const reservation = await this.findOne(reservacionId);

    const asignaciones = await this.huespedReservacionRepo.find({
      where: { reservacionId },
      relations: { habitacion: { tipo: true } },
    });

    const noches = Math.ceil(
      (new Date(reservation.fechaSalida).getTime() - new Date(reservation.fechaIngreso).getTime())
      / (1000 * 60 * 60 * 24),
    );

    return asignaciones.map((a) => ({
      guestId:     a.guestId,
      habitacionId: a.habitacionId,
      numero:      a.habitacion?.numero,
      piso:        a.habitacion?.piso,
      tipo:        a.habitacion?.tipo?.nombre,
      precioNoche: Number(a.precioNoche ?? a.habitacion?.tipo?.precioBase ?? 0),
      noches,
      subtotal:    Number(a.precioNoche ?? a.habitacion?.tipo?.precioBase ?? 0) * noches,
      esTitular:   a.esTitular,
    }));
  }

  // ── Agregar servicio ──────────────────────────────────────────────────────

  async agregarServicio(id: number, dto: AgregarServicioDto): Promise<void> {
    await this.findOne(id);

    const servicio = await this.servicioRepo.findOne({
      where: { id: dto.servicioId },
    });
    if (!servicio) {
      throw new NotFoundException(`Servicio #${dto.servicioId} no encontrado`);
    }

    await this.reservationRepository
      .createQueryBuilder()
      .insert()
      .into('reservacion_servicio')
      .values({
        reservacionId: id,
        servicioId: dto.servicioId,
        cantidad: dto.cantidad ?? 1,
        precioUnitario: Number(servicio.precio),
        fechaServicio: dto.fecha ?? null,
        notas: dto.notas ?? null,
      })
      .execute();
  }

  // ── Agregar actividad ─────────────────────────────────────────────────────

  async agregarActividad(id: number, dto: AgregarActividadDto): Promise<void> {
    await this.findOne(id);

    const evento = await this.eventoRepo.findOne({
      where: { id: dto.eventoId },
      relations: { actividad: true },
    });
    if (!evento) {
      throw new NotFoundException(`Evento #${dto.eventoId} no encontrado`);
    }

    await this.reservationRepository
      .createQueryBuilder()
      .insert()
      .into('reservacion_actividad')
      .values({
        reservacionId: id,
        eventoId: dto.eventoId,
        cantidadPersonas: dto.cantidadPersonas,
        precioUnitario: Number(evento.actividad.precio),
        notas: dto.notas ?? null,
      })
      .execute();
  }

  // ── Asignar plan ──────────────────────────────────────────────────────────

  async asignarPlan(id: number, dto: AsignarPlanDto): Promise<Reservation> {
    const reservation = await this.findOne(id);

    const plan = await this.planRepo.findOne({ where: { id: dto.planId } });
    if (!plan) {
      throw new NotFoundException(`Plan #${dto.planId} no encontrado`);
    }

    const cantPersonas = reservation.guests?.length ?? 1;

    if (plan.maxPersonas && cantPersonas > plan.maxPersonas) {
      throw new BadRequestException(
        `Este plan es para máximo ${plan.maxPersonas} persona(s) y la reserva tiene ${cantPersonas}`,
      );
    }

    reservation.planId     = dto.planId;
    reservation.precioTotal = Number(plan.precioPersona) * cantPersonas;

    return this.reservationRepository.save(reservation);
  }

  // ── Quitar plan ───────────────────────────────────────────────────────────

  async quitarPlan(id: number): Promise<Reservation> {
    const reservation = await this.findOne(id);
    reservation.planId      = undefined;
    reservation.precioTotal = 0;
    return this.reservationRepository.save(reservation);
  }

  // ── Actualizar datos generales (admin) ────────────────────────────────────

  async updateAdmin(
    id: number,
    dto: UpdateReservationAdminDto,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);
    Object.assign(reservation, dto);
    return this.reservationRepository.save(reservation);
  }

  // ── Desglose financiero ───────────────────────────────────────────────────

  async calcularDesglose(id: number) {
    const reservation = await this.findOne(id);

    const noches = Math.ceil(
      (new Date(reservation.fechaSalida).getTime() - new Date(reservation.fechaIngreso).getTime())
      / (1000 * 60 * 60 * 24),
    );

    // Habitaciones
    const asignaciones = await this.huespedReservacionRepo.find({
      where: { reservacionId: id },
      relations: { habitacion: { tipo: true } },
    });

    const habitaciones = asignaciones
      .filter((a) => a.habitacionId)
      .map((a) => {
        const precioNoche = Number(a.precioNoche ?? a.habitacion?.tipo?.precioBase ?? 0);
        return {
          guestId:      a.guestId,
          habitacionId: a.habitacionId!,
          numero:       a.habitacion?.numero ?? '',
          precioNoche,
          noches,
          subtotal:     precioNoche * noches,
        };
      });

    // Servicios
    const serviciosAsignados = await this.reservacionServicioRepo.find({
      where: { reservacionId: id },
      relations: { servicio: true },
    });

    const servicios = serviciosAsignados.map((s) => ({
      servicioId:     s.servicioId,
      nombre:         s.servicio?.nombre ?? '',
      cantidad:       s.cantidad,
      precioUnitario: Number(s.precioUnitario),
      subtotal:       Number(s.precioUnitario) * s.cantidad,
      fecha:          s.fechaServicio,
    }));

    // Actividades
    const actividadesAsignadas = await this.reservacionActividadRepo.find({
      where: { reservacionId: id },
      relations: { evento: { actividad: true } },
    });

    const actividades = actividadesAsignadas.map((a) => ({
      eventoId:         a.eventoId,
      nombre:           a.evento?.actividad?.nombre ?? '',
      fecha:            a.evento?.fecha ?? '',
      cantidadPersonas: a.cantidadPersonas,
      precioUnitario:   Number(a.precioUnitario),
      subtotal:         Number(a.precioUnitario) * a.cantidadPersonas,
    }));

    // Totales por sección
    const subtotalHabitaciones = habitaciones.reduce((s, h) => s + h.subtotal, 0);
    const subtotalServicios     = servicios.reduce((s, sv) => s + sv.subtotal, 0);
    const subtotalActividades   = actividades.reduce((s, a) => s + a.subtotal, 0);

    const conPlan = !!reservation.planId;
    const total   = conPlan
      ? Number(reservation.precioTotal)
      : subtotalHabitaciones + subtotalServicios + subtotalActividades;

    // Pagos
    const pagos  = await this.pagoRepo.find({ where: { reservacionId: id } });
    const pagado = pagos
      .filter((p) => p.estado === 'completado')
      .reduce((s, p) => s + Number(p.monto), 0);

    return {
      reservacionId: id,
      conPlan,
      planId:        reservation.planId,
      noches,
      habitaciones,
      servicios,
      actividades,
      subtotalHabitaciones,
      subtotalServicios,
      subtotalActividades,
      total,
      pagado,
      pendiente: total - pagado,
    };
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  private validateDates(fechaIngreso: string, fechaSalida: string): void {
    const ingreso = new Date(fechaIngreso);
    const salida = new Date(fechaSalida);

    if (salida <= ingreso) {
      throw new BadRequestException(
        'La fecha de salida debe ser posterior a la fecha de ingreso',
      );
    }
  }
}
