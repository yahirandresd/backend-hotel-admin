import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,

    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,

    @InjectRepository(Habitacion)
    private readonly habitacionRepo: Repository<Habitacion>,
  ) {}

  // ── Reporte de reservaciones por rango de fechas ──────────────────────────

  async reporteReservaciones(desde: string, hasta: string) {
    const reservaciones = await this.reservationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.guests', 'guests')
      .where('r.fechaIngreso >= :desde', { desde })
      .andWhere('r.fechaIngreso <= :hasta', { hasta })
      .orderBy('r.fechaIngreso', 'ASC')
      .getMany();

    const total = reservaciones.length;
    const porEstado = reservaciones.reduce((acc, r) => {
      acc[r.estado] = (acc[r.estado] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      desde,
      hasta,
      total,
      porEstado,
      reservaciones: reservaciones.map((r) => ({
        id:            r.id,
        titularDocNum: r.titularDocNum,
        fechaIngreso:  r.fechaIngreso,
        fechaSalida:   r.fechaSalida,
        estado:        r.estado,
        motivo:        r.motivo,
        totalHuespedes: r.guests?.length ?? 0,
        precioTotal:   Number(r.precioTotal),
      })),
    };
  }

  // ── Reporte de ingresos por rango de fechas ───────────────────────────────

  async reporteIngresos(desde: string, hasta: string) {
    const pagos = await this.pagoRepo
      .createQueryBuilder('p')
      .where('p.fechaPago >= :desde', { desde })
      .andWhere('p.fechaPago <= :hasta', { hasta })
      .andWhere('p.estado = :estado', { estado: 'completado' })
      .orderBy('p.fechaPago', 'ASC')
      .getMany();

    const totalIngresos = pagos.reduce((sum, p) => sum + Number(p.monto), 0);

    const porMetodo = pagos.reduce((acc, p) => {
      acc[p.metodo] = (acc[p.metodo] ?? 0) + Number(p.monto);
      return acc;
    }, {} as Record<string, number>);

    return {
      desde,
      hasta,
      totalIngresos,
      porMetodo,
      pagos: pagos.map((p) => ({
        id:            p.id,
        reservacionId: p.reservacionId,
        monto:         Number(p.monto),
        metodo:        p.metodo,
        referencia:    p.referencia,
        fechaPago:     p.fechaPago,
      })),
    };
  }

  // ── Reporte de ocupación de habitaciones ──────────────────────────────────

  async reporteOcupacion() {
    const habitaciones = await this.habitacionRepo.find({
      relations: { tipo: true },
      order:     { piso: 'ASC', numero: 'ASC' },
    });

    const resumen = {
      total:           habitaciones.length,
      disponibles:     0,
      ocupadas:        0,
      mantenimiento:   0,
      fueraDeServicio: 0,
    };

    habitaciones.forEach((h) => {
      if (h.estado === 'disponible')        resumen.disponibles++;
      if (h.estado === 'ocupada')           resumen.ocupadas++;
      if (h.estado === 'mantenimiento')     resumen.mantenimiento++;
      if (h.estado === 'fuera_de_servicio') resumen.fueraDeServicio++;
    });

    const porcentajeOcupacion = resumen.total > 0
      ? Math.round((resumen.ocupadas / resumen.total) * 100)
      : 0;

    return {
      resumen,
      porcentajeOcupacion,
      habitaciones: habitaciones.map((h) => ({
        id:     h.id,
        numero: h.numero,
        piso:   h.piso,
        estado: h.estado,
        tipo:   h.tipo?.nombre ?? '',
        precio: Number(h.tipo?.precioBase ?? 0),
      })),
    };
  }

  // ── Reporte general del negocio ───────────────────────────────────────────

  async reporteGeneral(desde: string, hasta: string) {
    const [reservaciones, ingresos, ocupacion] = await Promise.all([
      this.reporteReservaciones(desde, hasta),
      this.reporteIngresos(desde, hasta),
      this.reporteOcupacion(),
    ]);

    return {
      periodo: { desde, hasta },
      reservaciones: {
        total:     reservaciones.total,
        porEstado: reservaciones.porEstado,
      },
      ingresos: {
        total:     ingresos.totalIngresos,
        porMetodo: ingresos.porMetodo,
      },
      ocupacion: {
        porcentaje: ocupacion.porcentajeOcupacion,
        resumen:    ocupacion.resumen,
      },
    };
  }
}