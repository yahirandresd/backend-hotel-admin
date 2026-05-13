import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guest } from './entities/guest.entity';
import { HuespedReservacion } from '../reservations/entities/huesped-reservacion.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { CreateReservationDto } from '../reservations/dto/create-reservation.dto';

@Injectable()
export class GuestsService {
  constructor(
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,

    @InjectRepository(HuespedReservacion)
    private readonly huespedReservacionRepo: Repository<HuespedReservacion>,

    @InjectRepository(Habitacion)
    private readonly habitacionRepo: Repository<Habitacion>,
  ) {}

  // ── Usado internamente por ReservationsService ─────────────────────────────

  buildTitular(dto: CreateReservationDto): Guest {
    return this.guestRepository.create({
      docType:          dto.docType,
      docNum:           dto.docNum,
      nombre:           dto.nombre,
      apellido:         dto.apellido,
      fechaNac:         dto.fechaNac,
      ciudadResidencia: dto.ciudadResidencia,
      ciudadOrigen:     dto.ciudadOrigen,
      tel1:             dto.tel1,
      tel2:             dto.tel2,
      vacuna:           dto.vacunaTitular,
      esTitular:        true,
    });
  }

  buildAcompanantes(guests: CreateGuestDto[]): Guest[] {
    return guests.map((g) =>
      this.guestRepository.create({ ...g, esTitular: false }),
    );
  }

  hasTitularData(dto: Partial<CreateReservationDto>): boolean {
    return !!(
      dto.docType || dto.docNum || dto.nombre || dto.apellido ||
      dto.fechaNac || dto.ciudadResidencia || dto.ciudadOrigen ||
      dto.tel1 || dto.tel2 !== undefined || dto.vacunaTitular
    );
  }

  applyTitularUpdates(guest: Guest, dto: Partial<CreateReservationDto>): Guest {
    if (dto.docType)            guest.docType          = dto.docType;
    if (dto.docNum)             guest.docNum           = dto.docNum;
    if (dto.nombre)             guest.nombre           = dto.nombre;
    if (dto.apellido)           guest.apellido         = dto.apellido;
    if (dto.fechaNac)           guest.fechaNac         = dto.fechaNac;
    if (dto.ciudadResidencia)   guest.ciudadResidencia = dto.ciudadResidencia;
    if (dto.ciudadOrigen)       guest.ciudadOrigen     = dto.ciudadOrigen;
    if (dto.tel1)               guest.tel1             = dto.tel1;
    if (dto.tel2 !== undefined) guest.tel2             = dto.tel2;
    if (dto.vacunaTitular)      guest.vacuna           = dto.vacunaTitular;
    return guest;
  }

  async save(guest: Guest): Promise<Guest> {
    return this.guestRepository.save(guest);
  }

  // ── Endpoints propios ──────────────────────────────────────────────────────

  async findAll(): Promise<Guest[]> {
    return this.guestRepository.find({
      relations: ['reservation'],
      order: { reservationId: 'ASC', esTitular: 'DESC' },
    });
  }

  async findByReservation(reservationId: number): Promise<Guest[]> {
    return this.guestRepository.find({
      where: { reservationId },
      relations: ['reservation'],
      order: { esTitular: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Guest> {
    const guest = await this.guestRepository.findOne({
      where: { id },
      relations: ['reservation'],
    });
    if (!guest) throw new NotFoundException(`Huésped #${id} no encontrado`);
    return guest;
  }

  async update(id: number, dto: UpdateGuestDto): Promise<Guest> {
    const guest = await this.findOne(id);
    Object.assign(guest, dto);
    return this.guestRepository.save(guest);
  }

  async remove(id: number): Promise<void> {
    const guest = await this.findOne(id);

    const asignaciones = await this.huespedReservacionRepo.find({
      where: { guestId: id },
    });

    for (const asignacion of asignaciones) {
      if (asignacion.habitacionId) {
        const otrasActivas = await this.huespedReservacionRepo
          .createQueryBuilder('hr')
          .innerJoin('hr.reservacion', 'r')
          .where('hr.habitacionId = :hid', { hid: asignacion.habitacionId })
          .andWhere('hr.guestId != :guestId', { guestId: id })
          .andWhere("r.estado IN ('pendiente', 'confirmada', 'check_in')")
          .getCount();

        if (otrasActivas === 0) {
          await this.habitacionRepo.update(asignacion.habitacionId, { estado: 'disponible' });
        }
      }

      await this.huespedReservacionRepo.remove(asignacion);
    }

    await this.guestRepository.remove(guest);
  }
}