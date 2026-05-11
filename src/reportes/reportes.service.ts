import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';
import { ActividadEvento } from '../actividades/entities/actividad-evento.entity';
import { ActividadEventoGasto } from '../actividades/entities/actividad-evento-gasto.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,

    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,

    @InjectRepository(Habitacion)
    private readonly habitacionRepo: Repository<Habitacion>,

    @InjectRepository(ActividadEvento)
    private readonly eventoRepo: Repository<ActividadEvento>,

    @InjectRepository(ActividadEventoGasto)
    private readonly gastoRepo: Repository<ActividadEventoGasto>,
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

  // ── Reporte de actividades y utilidad ────────────────────────────────────

  async reporteActividades(desde: string, hasta: string) {
    const eventos = await this.eventoRepo
      .createQueryBuilder('evento')
      .leftJoinAndSelect('evento.actividad', 'actividad')
      .leftJoinAndSelect('evento.gastos', 'gastos')
      .where('evento.fecha >= :desde', { desde })
      .andWhere('evento.fecha <= :hasta', { hasta })
      .orderBy('evento.fecha', 'ASC')
      .getMany();

    const reporte = await Promise.all(
      eventos.map(async (evento) => {
        const totalGastos = evento.gastos?.reduce(
          (sum, g) => sum + Number(g.monto), 0,
        ) ?? 0;

        const ingresos = await this.eventoRepo
          .createQueryBuilder('e')
          .leftJoin('e.reservacionActividades', 'ra')
          .select('SUM(ra.precioUnitario * ra.cantidadPersonas)', 'total')
          .where('e.id = :id', { id: evento.id })
          .getRawOne();

        const totalIngresos = Number(ingresos?.total ?? 0);
        const utilidad      = totalIngresos - totalGastos;

        return {
          eventoId:      evento.id,
          actividad:     evento.actividad?.nombre ?? '',
          fecha:         evento.fecha,
          estado:        evento.estado,
          totalIngresos,
          totalGastos,
          utilidad,
          gastos:        evento.gastos?.map((g) => ({
            concepto: g.concepto,
            monto:    Number(g.monto),
          })) ?? [],
        };
      }),
    );

    const totales = reporte.reduce(
      (acc, r) => {
        acc.totalIngresos += r.totalIngresos;
        acc.totalGastos   += r.totalGastos;
        acc.utilidad      += r.utilidad;
        return acc;
      },
      { totalIngresos: 0, totalGastos: 0, utilidad: 0 },
    );

    return {
      desde,
      hasta,
      totales,
      eventos: reporte,
    };
  }

  // ── Reporte general del negocio ───────────────────────────────────────────

  async reporteGeneral(desde: string, hasta: string) {
    const [reservaciones, ingresos, ocupacion, actividades] = await Promise.all([
      this.reporteReservaciones(desde, hasta),
      this.reporteIngresos(desde, hasta),
      this.reporteOcupacion(),
      this.reporteActividades(desde, hasta),
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
      actividades: {
        totales: actividades.totales,
      },
    };
  }
}