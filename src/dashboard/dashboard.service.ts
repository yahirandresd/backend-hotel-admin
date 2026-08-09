import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Reservation } from '../reservations/entities/reservation.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Habitacion } from '../habitacion/entities/habitacion.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,

    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,

    @InjectRepository(Habitacion)
    private readonly habitacionRepo: Repository<Habitacion>,
  ) {}

  // ── Resumen general ───────────────────────────────────────────────────────

  async resumen() {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    const hoyStr = hoy.toISOString().split('T')[0];

    // Reservaciones del mes
    const reservacionesMes = await this.reservationRepo.count({
      where: {
        createdAt: Between(inicioMes, finMes),
      },
    });

    // Ingresos del mes (pagos completados)
    const ingresosMes = await this.pagoRepo
      .createQueryBuilder('pago')
      .select('SUM(pago.monto)', 'total')
      .where('pago.estado = :estado', { estado: 'completado' })
      .andWhere('pago.fechaPago BETWEEN :inicio AND :fin', {
        inicio: inicioMes,
        fin: finMes,
      })
      .getRawOne();

    // Habitaciones disponibles hoy
    const habitacionesDisponibles = await this.habitacionRepo.count({
      where: { estado: 'disponible' },
    });

    const totalHabitaciones = await this.habitacionRepo.count();

    // Reservaciones activas hoy (check-in <= hoy <= check-out)
    const reservacionesActivas = await this.reservationRepo
      .createQueryBuilder('r')
      .where('r.fechaIngreso <= :hoy', { hoy: hoyStr })
      .andWhere('r.fechaSalida >= :hoy', { hoy: hoyStr })
      .getCount();

    return {
      reservacionesMes,
      ingresosMes: Number(ingresosMes?.total ?? 0),
      habitacionesDisponibles,
      totalHabitaciones,
      ocupacion:
        totalHabitaciones > 0
          ? Math.round(
              ((totalHabitaciones - habitacionesDisponibles) /
                totalHabitaciones) *
                100,
            )
          : 0,
      reservacionesActivas,
    };
  }

  // ── Ingresos por mes (últimos 6 meses) ───────────────────────────────────

  async ingresosPorMes() {
    const meses: { mes: string; total: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

      const result = await this.pagoRepo
        .createQueryBuilder('pago')
        .select('SUM(pago.monto)', 'total')
        .where('pago.estado = :estado', { estado: 'completado' })
        .andWhere('pago.fechaPago BETWEEN :inicio AND :fin', { inicio, fin })
        .getRawOne();

      meses.push({
        mes: inicio.toLocaleString('es-CO', {
          month: 'short',
          year: 'numeric',
        }),
        total: Number(result?.total ?? 0),
      });
    }

    return meses;
  }

  // ── Reservaciones por estado ──────────────────────────────────────────────

  async reservacionesPorEstado() {
    const estados = [
      'pendiente',
      'confirmada',
      'check_in',
      'check_out',
      'cancelada',
      'no_show',
    ];

    const result = await Promise.all(
      estados.map(async (estado) => ({
        estado,
        total: await this.reservationRepo.count({ where: { estado } as any }),
      })),
    );

    return result.filter((r) => r.total > 0);
  }

  // ── Próximas llegadas (hoy y mañana) ──────────────────────────────────────

  async proximasLlegadas() {
    const hoy = new Date();
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);

    const hoyStr = hoy.toISOString().split('T')[0];
    const mananaStr = manana.toISOString().split('T')[0];

    return this.reservationRepo
      .createQueryBuilder('r')
      .where('r.fechaIngreso IN (:...fechas)', { fechas: [hoyStr, mananaStr] })
      .orderBy('r.fechaIngreso', 'ASC')
      .getMany();
  }

  // ── Próximas salidas (hoy y mañana) ───────────────────────────────────────

  async proximasSalidas() {
    const hoy = new Date();
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);

    const hoyStr = hoy.toISOString().split('T')[0];
    const mananaStr = manana.toISOString().split('T')[0];

    return this.reservationRepo
      .createQueryBuilder('r')
      .where('r.fechaSalida IN (:...fechas)', { fechas: [hoyStr, mananaStr] })
      .orderBy('r.fechaSalida', 'ASC')
      .getMany();
  }
}
