import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guest } from './entities/guest.entity';
import { HuespedReservacion } from '../reservations/entities/huesped-reservacion.entity';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { CreateReservationDto } from '../reservations/dto/create-reservation.dto';
import { HabitacionService } from '../habitacion/habitacion.service';
import { ESTADOS_ACTIVOS } from '../reservations/constants/reservation-estado.const';

@Injectable()
export class GuestsService {
  constructor(
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,

    @InjectRepository(HuespedReservacion)
    private readonly huespedReservacionRepo: Repository<HuespedReservacion>,

    private readonly habitacionService: HabitacionService,
  ) {}

  // ── Usado internamente por ReservationsService ─────────────────────────────

  buildTitular(dto: CreateReservationDto, hotelId: number): Guest {
    return this.guestRepository.create({
      hotelId,
      docType:          dto.docType,
      docNum:           dto.docNum,
      nombre:           dto.nombre,
      apellido:         dto.apellido,
      fechaNac:         dto.fechaNac,
      ciudadResidencia: dto.ciudadResidencia,
      ciudadOrigen:     dto.ciudadOrigen,
      tel1:             dto.tel1,
      tel2:             dto.tel2,
      email:            dto.email,
      vacuna:           dto.vacunaTitular,
      esTitular:        true,
    });
  }

  buildAcompanantes(guests: CreateGuestDto[], hotelId: number): Guest[] {
    return guests.map((g) =>
      this.guestRepository.create({ ...g, hotelId, esTitular: false }),
    );
  }

  hasTitularData(dto: Partial<CreateReservationDto>): boolean {
    return !!(
      dto.docType || dto.docNum || dto.nombre || dto.apellido ||
      dto.fechaNac || dto.ciudadResidencia || dto.ciudadOrigen ||
      dto.tel1 || dto.tel2 !== undefined || dto.email || dto.vacunaTitular
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
    if (dto.email)              guest.email            = dto.email;
    if (dto.vacunaTitular)      guest.vacuna           = dto.vacunaTitular;
    return guest;
  }

  async save(guest: Guest): Promise<Guest> {
    return this.guestRepository.save(guest);
  }

  // ── Endpoints propios ──────────────────────────────────────────────────────

  async findAll(hotelId: number): Promise<Guest[]> {
    return this.guestRepository.find({
      where: { hotelId },
      relations: ['reservation'],
      order: { reservationId: 'ASC', esTitular: 'DESC' },
    });
  }

  async findByReservation(reservationId: number, hotelId: number): Promise<Guest[]> {
    return this.guestRepository.find({
      where: { reservationId, hotelId },
      relations: ['reservation'],
      order: { esTitular: 'DESC' },
    });
  }

  async findOne(id: number, hotelId: number): Promise<Guest> {
    const guest = await this.guestRepository.findOne({
      where: { id, hotelId },
      relations: ['reservation'],
    });
    if (!guest) throw new NotFoundException(`Huésped #${id} no encontrado`);
    return guest;
  }

  async update(id: number, dto: UpdateGuestDto, hotelId: number): Promise<Guest> {
    const guest = await this.findOne(id, hotelId);
    Object.assign(guest, dto);
    return this.guestRepository.save(guest);
  }

  async remove(id: number, hotelId: number): Promise<void> {
    const guest = await this.findOne(id, hotelId);

    const asignaciones = await this.huespedReservacionRepo.find({
      where: { guestId: id, hotelId },
    });

    for (const asignacion of asignaciones) {
      if (asignacion.habitacionId) {
        const otrasActivas = await this.huespedReservacionRepo
          .createQueryBuilder('hr')
          .innerJoin('hr.reservacion', 'r')
          .where('hr.habitacionId = :hid', { hid: asignacion.habitacionId })
          .andWhere('hr.guestId != :guestId', { guestId: id })
          .andWhere('r.estado IN (:...estados)', { estados: ESTADOS_ACTIVOS })
          .getCount();

        if (otrasActivas === 0) {
          await this.habitacionService.liberar(asignacion.habitacionId);
        }
      }

      await this.huespedReservacionRepo.remove(asignacion);
    }

    await this.guestRepository.remove(guest);
  }
}
