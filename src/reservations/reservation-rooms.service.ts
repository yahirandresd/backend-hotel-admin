import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { REQUEST_MANAGER } from '../database/tenant-context';
import { HuespedReservacion } from './entities/huesped-reservacion.entity';
import { Reservation } from './entities/reservation.entity';
import { HabitacionService } from '../habitacion/habitacion.service';
import { AsignarHabitacionDto } from './dto/admin-reservation.dto';
import { ReservationPricingService } from './reservation-pricing.service';

@Injectable()
export class ReservationRoomsService {
  constructor(
    @InjectRepository(HuespedReservacion)
    private readonly huespedReservacionRepo: Repository<HuespedReservacion>,

    private readonly habitacionService: HabitacionService,
    private readonly pricingService: ReservationPricingService,

    @Inject(REQUEST_MANAGER)
    private readonly manager: EntityManager,
  ) {}

  async asignarHabitacion(
    reservation: Reservation,
    dto: AsignarHabitacionDto,
  ): Promise<HuespedReservacion> {
    const guest = reservation.guests.find((g) => g.id === dto.guestId);
    if (!guest) {
      throw new NotFoundException(
        `Huésped #${dto.guestId} no pertenece a esta reserva`,
      );
    }

    const habitacion = await this.habitacionService.findOne(dto.habitacionId, reservation.hotelId!);

    if (habitacion.estado === 'fuera_de_servicio' || habitacion.estado === 'mantenimiento') {
      throw new BadRequestException(
        `La habitación ${habitacion.numero} no está disponible (${habitacion.estado})`,
      );
    }

    const disponible = await this.habitacionService.estaDisponibleEnRango(
      dto.habitacionId,
      reservation.fechaIngreso,
      reservation.fechaSalida,
      reservation.id,
    );
    if (!disponible) {
      throw new BadRequestException(
        `La habitación ${habitacion.numero} ya está asignada en ese rango de fechas`,
      );
    }

    const precioNoche = Number(habitacion.tipo.precioBase);

    const existente = await this.huespedReservacionRepo.findOne({
      where: { reservacionId: reservation.id, guestId: dto.guestId, hotelId: reservation.hotelId },
    });

    await this.manager.transaction(async (manager) => {
      if (existente) {
        if (existente.habitacionId && existente.habitacionId !== dto.habitacionId) {
          await manager.update(
            HuespedReservacion,
            { id: existente.id },
            { habitacionId: dto.habitacionId, precioNoche },
          );
        } else if (!existente.habitacionId) {
          await manager.update(
            HuespedReservacion,
            { id: existente.id },
            { habitacionId: dto.habitacionId, precioNoche },
          );
        }
      } else {
        await manager.save(
          HuespedReservacion,
          manager.create(HuespedReservacion, {
            hotelId:       reservation.hotelId,
            guestId:       dto.guestId,
            reservacionId: reservation.id,
            habitacionId:  dto.habitacionId,
            esTitular:     guest.esTitular,
            precioNoche,
          }),
        );
      }
    });

    const asignacion = await this.huespedReservacionRepo.findOne({
      where: { reservacionId: reservation.id, guestId: dto.guestId },
      relations: { habitacion: true },
    });

    if (!asignacion) throw new NotFoundException('Asignación no encontrada');
    return asignacion;
  }

  async desasignarHabitacion(reservacionId: number, guestId: number, hotelId: number): Promise<void> {
    const asignacion = await this.huespedReservacionRepo.findOne({
      where: { reservacionId, guestId, hotelId },
    });

    if (!asignacion) {
      throw new NotFoundException(
        `No hay habitación asignada al huésped #${guestId} en esta reserva`,
      );
    }

    await this.huespedReservacionRepo.remove(asignacion);
  }

  async findAsignaciones(reservation: Reservation) {
    const noches = this.pricingService.calcularNoches(
      reservation.fechaIngreso,
      reservation.fechaSalida,
    );

    const asignaciones = await this.huespedReservacionRepo.find({
      where: { reservacionId: reservation.id, hotelId: reservation.hotelId },
      relations: { habitacion: { tipo: true } },
    });

    return asignaciones.map((a) => ({
      guestId:      a.guestId,
      habitacionId: a.habitacionId,
      numero:       a.habitacion?.numero,
      piso:         a.habitacion?.piso,
      tipo:         a.habitacion?.tipo?.nombre,
      precioNoche:  Number(a.precioNoche ?? a.habitacion?.tipo?.precioBase ?? 0),
      noches,
      subtotal:     Number(a.precioNoche ?? a.habitacion?.tipo?.precioBase ?? 0) * noches,
      esTitular:    a.esTitular,
    }));
  }
}
