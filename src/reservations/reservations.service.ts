import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { GuestsService } from '../guests/guests.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    private readonly guestsService: GuestsService,
  ) {}

  // ── Crear ─────────────────────────────────────────────────────────────────

  async create(dto: CreateReservationDto): Promise<Reservation> {
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
    });

    const titular = this.guestsService.buildTitular(dto);
    const acompanantes = this.guestsService.buildAcompanantes(dto.guests ?? []);

    reservation.guests = [titular, ...acompanantes];

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
      relations: { guests: true },
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

    if (dto.fechaIngreso) reservation.fechaIngreso = dto.fechaIngreso;
    if (dto.fechaSalida) reservation.fechaSalida = dto.fechaSalida;
    if (dto.motivo) reservation.motivo = dto.motivo;
    if (dto.aceptaTerminos !== undefined)
      reservation.aceptaTerminos = dto.aceptaTerminos;

    if (this.guestsService.hasTitularData(dto)) {
      const titularGuest = reservation.guests.find((g) => g.esTitular);

      if (titularGuest) {
        const updated = this.guestsService.applyTitularUpdates(
          titularGuest,
          dto,
        );
        await this.guestsService.save(updated);

        if (dto.docNum) reservation.titularDocNum = dto.docNum;
      }
    }

    return this.reservationRepository.save(reservation);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async remove(id: number): Promise<void> {
    const reservation = await this.findOne(id);
    await this.reservationRepository.remove(reservation);
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
