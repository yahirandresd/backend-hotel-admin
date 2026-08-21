import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HuespedReservacion } from './entities/huesped-reservacion.entity';
import { PagosService } from '../pagos/pagos.service';
import { Reservation } from './entities/reservation.entity';

@Injectable()
export class ReservationPricingService {
  constructor(
    @InjectRepository(HuespedReservacion)
    private readonly huespedReservacionRepo: Repository<HuespedReservacion>,

    private readonly pagosService: PagosService,
  ) {}

  calcularNoches(fechaIngreso: string, fechaSalida: string): number {
    return Math.ceil(
      (new Date(fechaSalida).getTime() - new Date(fechaIngreso).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }

  async calcularDesglose(reservation: Reservation) {
    const id     = reservation.id;
    const noches = this.calcularNoches(reservation.fechaIngreso, reservation.fechaSalida);

    const asignaciones = await this.huespedReservacionRepo.find({
      where: { reservacionId: id, hotelId: reservation.hotelId },
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

    const subtotalHabitaciones = habitaciones.reduce((s, h) => s + h.subtotal, 0);

    const conPlan = !!reservation.planId;
    const total   = conPlan
      ? Number(reservation.precioTotal)
      : subtotalHabitaciones;

    const pagado   = await this.pagosService.totalPorReservacion(id, reservation.hotelId!);

    return {
      reservacionId: id,
      conPlan,
      planId:        reservation.planId,
      noches,
      habitaciones,
      subtotalHabitaciones,
      total,
      pagado,
      pendiente: total - pagado,
    };
  }
}
