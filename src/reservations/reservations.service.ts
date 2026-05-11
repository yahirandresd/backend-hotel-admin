import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { HuespedReservacion } from './entities/huesped-reservacion.entity';
import { Guest } from '../guests/entities/guest.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { Servicio } from '../servicios/entities/servicio.entity';
import { ActividadEvento } from '../actividades/entities/actividad-evento.entity';
import { Plan } from '../planes/entities/plan.entity';
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
      relations: { guests: true },
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

    // Si hace check_out liberar habitaciones
    if (dto.estado === 'check_out' || dto.estado === 'cancelada') {
      const asignaciones = await this.huespedReservacionRepo.find({
        where: { reservacionId: id },
      });

      for (const asignacion of asignaciones) {
        if (asignacion.habitacionId) {
          await this.habitacionRepo.update(asignacion.habitacionId, {
            estado: 'disponible',
          });
        }
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

    if (existente) {
      // Liberar habitación anterior si era diferente
      if (
        existente.habitacionId &&
        existente.habitacionId !== dto.habitacionId
      ) {
        await this.habitacionRepo.update(existente.habitacionId, {
          estado: 'disponible',
        });
      }
      existente.habitacionId = dto.habitacionId;
      await this.huespedReservacionRepo.save(existente);
    } else {
      const asignacion = this.huespedReservacionRepo.create({
        guestId: dto.guestId,
        reservacionId: id,
        habitacionId: dto.habitacionId,
        esTitular: guest.esTitular,
      });
      await this.huespedReservacionRepo.save(asignacion);
    }

    // Marcar habitación como ocupada
    habitacion.estado = 'ocupada';
    await this.habitacionRepo.save(habitacion);

    const asignacion = await this.huespedReservacionRepo.findOne({
      where: { reservacionId: id, guestId: dto.guestId },
      relations: { habitacion: true },
    });

    if (!asignacion) {
      throw new NotFoundException('Asignación no encontrada');
    }

    return asignacion;
  }

  // ── Ver asignaciones de habitaciones ──────────────────────────────────────

  async findAsignaciones(reservacionId: number): Promise<HuespedReservacion[]> {
    await this.findOne(reservacionId);
    return this.huespedReservacionRepo.find({
      where: { reservacionId },
      relations: { habitacion: true },
    });
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

    reservation.planId = dto.planId;
    reservation.precioTotal = Number(plan.precio);

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
