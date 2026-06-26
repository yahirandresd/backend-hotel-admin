import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HuespedReservacion } from './entities/huesped-reservacion.entity';
import { ReservacionServicio } from './entities/reservacion-servicio.entity';
import { ReservacionActividad } from '../actividades/entities/reservacion-actividad.entity';
import { PagosService } from '../pagos/pagos.service';
import { Reservation } from './entities/reservation.entity';

@Injectable()
export class ReservationPricingService {
  constructor(
    @InjectRepository(HuespedReservacion)
    private readonly huespedReservacionRepo: Repository<HuespedReservacion>,

    @InjectRepository(ReservacionServicio)
    private readonly reservacionServicioRepo: Repository<ReservacionServicio>,

    @InjectRepository(ReservacionActividad)
    private readonly reservacionActividadRepo: Repository<ReservacionActividad>,

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

    const subtotalHabitaciones = habitaciones.reduce((s, h) => s + h.subtotal, 0);
    const subtotalServicios     = servicios.reduce((s, sv) => s + sv.subtotal, 0);
    const subtotalActividades   = actividades.reduce((s, a) => s + a.subtotal, 0);

    const conPlan = !!reservation.planId;
    const total   = conPlan
      ? Number(reservation.precioTotal)
      : subtotalHabitaciones + subtotalServicios + subtotalActividades;

    const pagado   = await this.pagosService.totalPorReservacion(id);

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
}
