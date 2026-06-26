import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { HuespedReservacion } from './entities/huesped-reservacion.entity';
import { Plan } from '../planes/entities/plan.entity';
import { ReservationLink } from '../reservation-links/entities/reservation-link.entity';
import { GuestsService } from '../guests/guests.service';
import { ReservationLinksService } from '../reservation-links/reservation-links.service';
import { ReservationRoomsService } from './reservation-rooms.service';
import { ReservationItemsService } from './reservation-items.service';
import { ReservationPricingService } from './reservation-pricing.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import {
  UpdateEstadoDto,
  AsignarHabitacionDto,
  AgregarServicioDto,
  AgregarActividadDto,
  AsignarPlanDto,
  UpdateReservationAdminDto,
} from './dto/admin-reservation.dto';
import { ESTADOS_QUE_LIBERAN_HABITACION } from './constants/reservation-estado.const';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(HuespedReservacion)
    private readonly huespedReservacionRepo: Repository<HuespedReservacion>,

    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,

    private readonly dataSource: DataSource,
    private readonly guestsService: GuestsService,
    private readonly linksService: ReservationLinksService,
    private readonly roomsService: ReservationRoomsService,
    private readonly itemsService: ReservationItemsService,
    private readonly pricingService: ReservationPricingService,
  ) {}

  // ── Crear (cliente) ───────────────────────────────────────────────────────

  async create(dto: CreateReservationDto, code: string): Promise<Reservation> {
    await this.linksService.validate(code);
    this.validateDates(dto.fechaIngreso, dto.fechaSalida);

    if (!dto.aceptaTerminos) {
      throw new BadRequestException('Debe aceptar los términos y condiciones');
    }

    const titular      = this.guestsService.buildTitular(dto);
    const acompanantes = this.guestsService.buildAcompanantes(dto.guests ?? []);

    return this.dataSource.transaction(async (manager) => {
      const reservation = manager.create(Reservation, {
        titularDocNum:  dto.docNum,
        fechaIngreso:   dto.fechaIngreso,
        fechaSalida:    dto.fechaSalida,
        motivo:         dto.motivo,
        aceptaTerminos: dto.aceptaTerminos,
        canalOrigen:    dto.canalOrigen ?? 'web',
        notas:          dto.notas,
        estado:         'pendiente',
        precioTotal:    0,
        guests:         [titular, ...acompanantes],
      });
      const saved = await manager.save(Reservation, reservation);
      await manager.update(ReservationLink, { code }, { reservationId: saved.id });
      return saved;
    });
  }

  // ── Crear (admin) ────────────────────────────────────────────────────────

  async createAdmin(dto: CreateReservationDto): Promise<Reservation> {
    this.validateDates(dto.fechaIngreso, dto.fechaSalida);

    if (!dto.aceptaTerminos) {
      throw new BadRequestException('Debe aceptar los términos y condiciones');
    }

    const titular      = this.guestsService.buildTitular(dto);
    const acompanantes = this.guestsService.buildAcompanantes(dto.guests ?? []);

    const reservation = this.reservationRepository.create({
      titularDocNum:  dto.docNum,
      fechaIngreso:   dto.fechaIngreso,
      fechaSalida:    dto.fechaSalida,
      motivo:         dto.motivo,
      aceptaTerminos: dto.aceptaTerminos,
      canalOrigen:    dto.canalOrigen ?? 'directo',
      notas:          dto.notas,
      estado:         'pendiente',
      precioTotal:    0,
      guests:         [titular, ...acompanantes],
    });

    return this.reservationRepository.save(reservation);
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

  // ── Actualizar ────────────────────────────────────────────────────────────

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

    const asignaciones = await this.huespedReservacionRepo.find({
      where: { reservacionId: id },
    });
    const habitacionIds = asignaciones
      .map((a) => a.habitacionId)
      .filter((hid): hid is number => !!hid);

    await this.dataSource.transaction(async (manager) => {
      const updateData: Partial<Reservation> = { estado: dto.estado };
      if (dto.notas) updateData.notas = dto.notas;
      await manager.update(Reservation, { id }, updateData);

      if (habitacionIds.length > 0) {
        if (dto.estado === 'check_in') {
          await manager
            .createQueryBuilder()
            .update('habitacion')
            .set({ estado: 'ocupada' })
            .whereInIds(habitacionIds)
            .execute();
        } else if (ESTADOS_QUE_LIBERAN_HABITACION.includes(dto.estado as any)) {
          await manager
            .createQueryBuilder()
            .update('habitacion')
            .set({ estado: 'disponible' })
            .whereInIds(habitacionIds)
            .execute();
        }
      }
    });

    return this.findOne(id);
  }

  // ── Asignar habitación ────────────────────────────────────────────────────

  async asignarHabitacion(
    id: number,
    dto: AsignarHabitacionDto,
  ): Promise<HuespedReservacion> {
    const reservation = await this.findOne(id);
    return this.roomsService.asignarHabitacion(reservation, dto);
  }

  // ── Desasignar habitación ─────────────────────────────────────────────────

  async desasignarHabitacion(reservacionId: number, guestId: number): Promise<void> {
    return this.roomsService.desasignarHabitacion(reservacionId, guestId);
  }

  // ── Ver asignaciones ──────────────────────────────────────────────────────

  async findAsignaciones(reservacionId: number) {
    const reservation = await this.findOne(reservacionId);
    return this.roomsService.findAsignaciones(reservation);
  }

  // ── Agregar servicio ──────────────────────────────────────────────────────

  async agregarServicio(id: number, dto: AgregarServicioDto): Promise<void> {
    await this.findOne(id);
    return this.itemsService.agregarServicio(id, dto);
  }

  // ── Agregar actividad ─────────────────────────────────────────────────────

  async agregarActividad(id: number, dto: AgregarActividadDto): Promise<void> {
    await this.findOne(id);
    return this.itemsService.agregarActividad(id, dto);
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

    reservation.planId      = dto.planId;
    reservation.precioTotal = Number(plan.precioPersona) * cantPersonas;

    return this.reservationRepository.save(reservation);
  }

  // ── Quitar plan ───────────────────────────────────────────────────────────

  async quitarPlan(id: number): Promise<Reservation> {
    await this.reservationRepository
      .createQueryBuilder()
      .update(Reservation)
      .set({ planId: () => 'NULL', precioTotal: 0 })
      .where('id = :id', { id })
      .execute();
    return this.findOne(id);
  }

  // ── Actualizar datos generales (admin) ────────────────────────────────────

  async updateAdmin(id: number, dto: UpdateReservationAdminDto): Promise<Reservation> {
    const reservation = await this.findOne(id);
    Object.assign(reservation, dto);
    return this.reservationRepository.save(reservation);
  }

  // ── Desglose financiero ───────────────────────────────────────────────────

  async calcularDesglose(id: number) {
    const reservation = await this.findOne(id);
    return this.pricingService.calcularDesglose(reservation);
  }

  // ── Helper privado ────────────────────────────────────────────────────────

  private validateDates(fechaIngreso: string, fechaSalida: string): void {
    const ingreso = new Date(fechaIngreso);
    const salida  = new Date(fechaSalida);

    if (salida <= ingreso) {
      throw new BadRequestException(
        'La fecha de salida debe ser posterior a la fecha de ingreso',
      );
    }
  }
}
