import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { REQUEST_MANAGER } from '../database/tenant-context';
import { Reservation } from './entities/reservation.entity';
import { HuespedReservacion } from './entities/huesped-reservacion.entity';
import { Plan } from '../planes/entities/plan.entity';
import { ReservationLink } from '../reservation-links/entities/reservation-link.entity';
import { GuestsService } from '../guests/guests.service';
import { ReservationLinksService } from '../reservation-links/reservation-links.service';
import { ReservationRoomsService } from './reservation-rooms.service';
import { ReservationPricingService } from './reservation-pricing.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import {
  UpdateEstadoDto,
  AsignarHabitacionDto,
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

    @Inject(REQUEST_MANAGER)
    private readonly manager: EntityManager,

    private readonly guestsService: GuestsService,
    private readonly linksService: ReservationLinksService,
    private readonly roomsService: ReservationRoomsService,
    private readonly pricingService: ReservationPricingService,
  ) {}

  // ── Crear (cliente) ───────────────────────────────────────────────────────

  async create(dto: CreateReservationDto, code: string): Promise<Reservation> {
    const link = await this.linksService.validate(code);
    const hotelId = link.hotelId!;
    this.validateDates(dto.fechaIngreso, dto.fechaSalida);

    if (!dto.aceptaTerminos) {
      throw new BadRequestException('Debe aceptar los términos y condiciones');
    }

    const titular      = this.guestsService.buildTitular(dto, hotelId);
    const acompanantes = this.guestsService.buildAcompanantes(dto.guests ?? [], hotelId);

    return this.manager.transaction(async (manager) => {
      const reservation = manager.create(Reservation, {
        hotelId,
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

  async createAdmin(dto: CreateReservationDto, hotelId: number): Promise<Reservation> {
    this.validateDates(dto.fechaIngreso, dto.fechaSalida);

    if (!dto.aceptaTerminos) {
      throw new BadRequestException('Debe aceptar los términos y condiciones');
    }

    const titular      = this.guestsService.buildTitular(dto, hotelId);
    const acompanantes = this.guestsService.buildAcompanantes(dto.guests ?? [], hotelId);

    const reservation = this.reservationRepository.create({
      hotelId,
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

  async findAll(hotelId: number): Promise<Reservation[]> {
    return this.reservationRepository.find({
      where: { hotelId },
      relations: { guests: true },
      order: {
        createdAt: 'DESC',
        guests: { esTitular: 'DESC' },
      },
    });
  }

  // ── Obtener uno ───────────────────────────────────────────────────────────

  async findOne(id: number, hotelId: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id, hotelId },
      relations: { guests: true, pagos: true, plan: true },
      order: { guests: { esTitular: 'DESC' } },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva #${id} no encontrada`);
    }

    return reservation;
  }

  // ── Actualizar ────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateReservationDto, hotelId: number): Promise<Reservation> {
    const reservation = await this.findOne(id, hotelId);

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

  async remove(id: number, hotelId: number): Promise<void> {
    const reservation = await this.findOne(id, hotelId);
    await this.reservationRepository.remove(reservation);
  }

  // ── Cambiar estado ────────────────────────────────────────────────────────

  async updateEstado(id: number, dto: UpdateEstadoDto, hotelId: number): Promise<Reservation> {
    const reservation = await this.findOne(id, hotelId);

    const asignaciones = await this.huespedReservacionRepo.find({
      where: { reservacionId: id, hotelId },
    });
    const habitacionIds = asignaciones
      .map((a) => a.habitacionId)
      .filter((hid): hid is number => !!hid);

    await this.manager.transaction(async (manager) => {
      const updateData: Partial<Reservation> = { estado: dto.estado };
      if (dto.notas) updateData.notas = dto.notas;
      await manager.update(Reservation, { id, hotelId }, updateData);

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

    return this.findOne(id, hotelId);
  }

  // ── Asignar habitación ────────────────────────────────────────────────────

  async asignarHabitacion(
    id: number,
    dto: AsignarHabitacionDto,
    hotelId: number,
  ): Promise<HuespedReservacion> {
    const reservation = await this.findOne(id, hotelId);
    return this.roomsService.asignarHabitacion(reservation, dto);
  }

  // ── Desasignar habitación ─────────────────────────────────────────────────

  async desasignarHabitacion(reservacionId: number, guestId: number, hotelId: number): Promise<void> {
    return this.roomsService.desasignarHabitacion(reservacionId, guestId, hotelId);
  }

  // ── Ver asignaciones ──────────────────────────────────────────────────────

  async findAsignaciones(reservacionId: number, hotelId: number) {
    const reservation = await this.findOne(reservacionId, hotelId);
    return this.roomsService.findAsignaciones(reservation);
  }

  // ── Asignar plan ──────────────────────────────────────────────────────────

  async asignarPlan(id: number, dto: AsignarPlanDto, hotelId: number): Promise<Reservation> {
    const reservation = await this.findOne(id, hotelId);

    const plan = await this.planRepo.findOne({ where: { id: dto.planId, hotelId } });
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

  async quitarPlan(id: number, hotelId: number): Promise<Reservation> {
    await this.reservationRepository
      .createQueryBuilder()
      .update(Reservation)
      .set({ planId: () => 'NULL', precioTotal: 0 })
      .where({ id, hotelId })
      .execute();
    return this.findOne(id, hotelId);
  }

  // ── Actualizar datos generales (admin) ────────────────────────────────────

  async updateAdmin(id: number, dto: UpdateReservationAdminDto, hotelId: number): Promise<Reservation> {
    const reservation = await this.findOne(id, hotelId);
    Object.assign(reservation, dto);
    return this.reservationRepository.save(reservation);
  }

  // ── Desglose financiero ───────────────────────────────────────────────────

  async calcularDesglose(id: number, hotelId: number) {
    const reservation = await this.findOne(id, hotelId);
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
