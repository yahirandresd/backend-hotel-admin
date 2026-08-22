import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habitacion } from './entities/habitacion.entity';
import { HuespedReservacion } from '../reservations/entities/huesped-reservacion.entity';
import { CreateHabitacionDto } from './dto/create-habitacion.dto';
import { UpdateHabitacionDto } from './dto/update-habitacion.dto';
import { TipoHabitacionService } from '../tipo-habitacion/tipo-habitacion.service';

@Injectable()
export class HabitacionService {
  constructor(
    @InjectRepository(Habitacion)
    private readonly habitacionRepo: Repository<Habitacion>,

    @InjectRepository(HuespedReservacion)
    private readonly huespedReservacionRepo: Repository<HuespedReservacion>,

    private readonly tipoHabitacionService: TipoHabitacionService,
  ) {}

  // ── Crear ─────────────────────────────────────────────────────────────────

  async create(dto: CreateHabitacionDto, hotelId: number): Promise<Habitacion> {
    // Verificar que el tipo existe y es del mismo hotel
    await this.tipoHabitacionService.findOne(dto.tipoId, hotelId);

    // Verificar que el número de habitación no esté duplicado en este hotel
    const existe = await this.habitacionRepo.findOne({
      where: { numero: dto.numero, hotelId },
    });
    if (existe) {
      throw new BadRequestException(`Ya existe una habitación con el número ${dto.numero}`);
    }

    const habitacion = this.habitacionRepo.create({ ...dto, hotelId });
    return this.habitacionRepo.save(habitacion);
  }

  // ── Listar ────────────────────────────────────────────────────────────────

  async findAll(hotelId: number): Promise<Habitacion[]> {
    return this.habitacionRepo.find({
      where: { hotelId },
      relations: { tipo: true },
      order: { piso: 'ASC', numero: 'ASC' },
    });
  }

  // ── Listar disponibles ────────────────────────────────────────────────────

  async findDisponibles(hotelId: number, desde?: string, hasta?: string): Promise<Habitacion[]> {
    if (desde || hasta) {
      return this.findDisponiblesPorRango(hotelId, desde!, hasta!);
    }

    return this.habitacionRepo.find({
      where: { hotelId, estado: 'disponible' },
      relations: { tipo: true },
      order: { piso: 'ASC', numero: 'ASC' },
    });
  }

  async findDisponiblesPorRango(hotelId: number, desde: string, hasta: string): Promise<Habitacion[]> {
    if (!desde || isNaN(Date.parse(desde))) {
      throw new BadRequestException('El parámetro desde debe ser una fecha válida (YYYY-MM-DD)');
    }
    if (!hasta || isNaN(Date.parse(hasta))) {
      throw new BadRequestException('El parámetro hasta debe ser una fecha válida (YYYY-MM-DD)');
    }
    if (new Date(hasta) <= new Date(desde)) {
      throw new BadRequestException('La fecha hasta debe ser posterior a desde');
    }

    const subquery = this.huespedReservacionRepo
      .createQueryBuilder('hr')
      .innerJoin('hr.reservacion', 'r')
      .select('hr.habitacionId')
      .where('hr.habitacionId IS NOT NULL')
      .andWhere('r.fechaIngreso < :hasta', { hasta })
      .andWhere('r.fechaSalida > :desde', { desde })
      .andWhere("r.estado NOT IN ('cancelada', 'no_show')");

    return this.habitacionRepo
      .createQueryBuilder('h')
      .innerJoinAndSelect('h.tipo', 'tipo')
      .where('h.hotelId = :hotelId', { hotelId })
      .andWhere("h.estado NOT IN ('fuera_de_servicio', 'mantenimiento')")
      .andWhere(`h.id NOT IN (${subquery.getQuery()})`)
      .setParameters(subquery.getParameters())
      .orderBy('h.piso', 'ASC')
      .addOrderBy('h.numero', 'ASC')
      .getMany();
  }

  // ── Obtener una ───────────────────────────────────────────────────────────

  async findOne(id: number, hotelId: number): Promise<Habitacion> {
    const habitacion = await this.habitacionRepo.findOne({
      where: { id, hotelId },
      relations: { tipo: true },
    });
    if (!habitacion) throw new NotFoundException(`Habitación #${id} no encontrada`);
    return habitacion;
  }

  // ── Actualizar ────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateHabitacionDto, hotelId: number): Promise<Habitacion> {
    const habitacion = await this.findOne(id, hotelId);

    if (dto.tipoId) await this.tipoHabitacionService.findOne(dto.tipoId, hotelId);

    if (dto.numero && dto.numero !== habitacion.numero) {
      const existe = await this.habitacionRepo.findOne({
        where: { numero: dto.numero, hotelId },
      });
      if (existe) {
        throw new BadRequestException(`Ya existe una habitación con el número ${dto.numero}`);
      }
    }

    Object.assign(habitacion, dto);
    return this.habitacionRepo.save(habitacion);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async remove(id: number, hotelId: number): Promise<void> {
    const habitacion = await this.findOne(id, hotelId);
    await this.habitacionRepo.remove(habitacion);
  }

  // ── Ocupación por fecha ───────────────────────────────────────────────────

  // Query/mapeo comunes entre findOcupacion (1 día exacto) y findOcupacionDetalleRango
  // (solape con un rango) — cada uno agrega su propia condición de fecha encima.
  // Verificado contra la BD real: TypeORM hidrata las columnas `type: 'date'` como
  // string 'YYYY-MM-DD' (no Date), igual en ambos métodos — el filtro por día en el
  // cliente puede comparar directo contra esas strings sin conversión.
  private buildAsignacionesQuery(hotelId: number) {
    return this.huespedReservacionRepo
      .createQueryBuilder('hr')
      .innerJoinAndSelect('hr.habitacion', 'habitacion')
      .innerJoinAndSelect('habitacion.tipo', 'tipo')
      .innerJoin('hr.reservacion', 'reservacion')
      .addSelect([
        'reservacion.id',
        'reservacion.estado',
        'reservacion.fechaIngreso',
        'reservacion.fechaSalida',
        'reservacion.titularDocNum',
      ])
      .where('hr.habitacionId IS NOT NULL')
      .andWhere('habitacion.hotelId = :hotelId', { hotelId })
      .andWhere("reservacion.estado NOT IN ('cancelada', 'no_show')");
  }

  private mapAsignacion(hr: HuespedReservacion) {
    return {
      habitacionId:      hr.habitacionId!,
      numero:            hr.habitacion!.numero,
      piso:              hr.habitacion!.piso,
      tipoId:            hr.habitacion!.tipoId,
      tipo:              hr.habitacion!.tipo?.nombre ?? '',
      precioBase:        Number(hr.habitacion!.tipo?.precioBase ?? 0),
      reservacionId:     hr.reservacionId,
      reservacionEstado: (hr.reservacion as any)?.estado ?? '',
      fechaIngreso:      (hr.reservacion as any)?.fechaIngreso ?? '',
      fechaSalida:       (hr.reservacion as any)?.fechaSalida ?? '',
      titularDocNum:     (hr.reservacion as any)?.titularDocNum ?? '',
      guestId:           hr.guestId,
      esTitular:         hr.esTitular,
    };
  }

  async findOcupacion(fecha: string, hotelId: number) {
    if (!fecha || isNaN(Date.parse(fecha))) {
      throw new BadRequestException('El parámetro fecha debe ser una fecha válida (YYYY-MM-DD)');
    }

    const asignaciones = await this.buildAsignacionesQuery(hotelId)
      .andWhere('reservacion.fechaIngreso <= :fecha', { fecha })
      .andWhere('reservacion.fechaSalida > :fecha', { fecha })
      .getMany();

    return asignaciones.map((hr) => this.mapAsignacion(hr));
  }

  // ── Detalle de ocupación por rango (calendario mensual, sin 1 request por día) ──

  async findOcupacionDetalleRango(desde: string, hasta: string, hotelId: number) {
    if (!desde || isNaN(Date.parse(desde))) {
      throw new BadRequestException('El parámetro desde debe ser una fecha válida (YYYY-MM-DD)');
    }
    if (!hasta || isNaN(Date.parse(hasta))) {
      throw new BadRequestException('El parámetro hasta debe ser una fecha válida (YYYY-MM-DD)');
    }
    if (new Date(hasta) < new Date(desde)) {
      throw new BadRequestException('La fecha hasta debe ser igual o posterior a desde');
    }
    const dias = (new Date(hasta).getTime() - new Date(desde).getTime()) / 86400000;
    if (dias > 370) {
      throw new BadRequestException('El rango no puede ser mayor a 370 días');
    }

    const asignaciones = await this.buildAsignacionesQuery(hotelId)
      .andWhere('reservacion.fechaIngreso < :hasta', { hasta })
      .andWhere('reservacion.fechaSalida > :desde', { desde })
      .getMany();

    return asignaciones.map((hr) => this.mapAsignacion(hr));
  }

  // ── Ocupación por rango (calendario mensual) ──────────────────────────────

  async findOcupacionRango(desde: string, hasta: string, hotelId: number) {
    if (!desde || isNaN(Date.parse(desde))) {
      throw new BadRequestException('El parámetro desde debe ser una fecha válida (YYYY-MM-DD)');
    }
    if (!hasta || isNaN(Date.parse(hasta))) {
      throw new BadRequestException('El parámetro hasta debe ser una fecha válida (YYYY-MM-DD)');
    }
    if (new Date(hasta) < new Date(desde)) {
      throw new BadRequestException('La fecha hasta debe ser igual o posterior a desde');
    }
    const dias = (new Date(hasta).getTime() - new Date(desde).getTime()) / 86400000;
    if (dias > 370) {
      throw new BadRequestException('El rango no puede ser mayor a 370 días');
    }

    const total = await this.habitacionRepo.count({ where: { hotelId } });

    // Una fila por día del rango (generate_series), con el conteo de habitaciones
    // ocupadas ese día — evita 1 query por día desde el frontend.
    const filas: { fecha: string; ocupadas: number }[] = await this.habitacionRepo.manager.query(
      `
      SELECT
        to_char(d.fecha, 'YYYY-MM-DD') AS fecha,
        COUNT(DISTINCT hr."habitacionId")::int AS ocupadas
      FROM generate_series($1::date, $2::date, interval '1 day') AS d(fecha)
      LEFT JOIN reservations r
        ON r.hotel_id = $3
        AND r.estado NOT IN ('cancelada', 'no_show')
        AND r."fechaIngreso" <= d.fecha
        AND r."fechaSalida" > d.fecha
      LEFT JOIN huesped_reservacion hr
        ON hr."reservacionId" = r.id
        AND hr."habitacionId" IS NOT NULL
      GROUP BY d.fecha
      ORDER BY d.fecha
      `,
      [desde, hasta, hotelId],
    );

    return filas.map((f) => ({
      fecha:      f.fecha,
      ocupadas:   Number(f.ocupadas),
      total,
      porcentaje: total > 0 ? Math.round((Number(f.ocupadas) / total) * 100) : 0,
    }));
  }

  // ── Gestión de estado físico ──────────────────────────────────────────────
  // (habitacionId siempre llega derivado de datos ya scoped por hotel — ver
  // ReservationRoomsService/GuestsService — no toma IDs directos del cliente)

  async ocupar(habitacionId: number): Promise<void> {
    await this.habitacionRepo.update(habitacionId, { estado: 'ocupada' });
  }

  async liberar(habitacionId: number): Promise<void> {
    await this.habitacionRepo.update(habitacionId, { estado: 'disponible' });
  }

  async liberarMultiple(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await this.habitacionRepo
      .createQueryBuilder()
      .update()
      .set({ estado: 'disponible' })
      .whereInIds(ids)
      .execute();
  }

  async ocuparMultiple(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await this.habitacionRepo
      .createQueryBuilder()
      .update()
      .set({ estado: 'ocupada' })
      .whereInIds(ids)
      .execute();
  }

  async estaDisponibleEnRango(
    habitacionId: number,
    desde: string,
    hasta: string,
    excluyendoReservacionId?: number,
  ): Promise<boolean> {
    const qb = this.huespedReservacionRepo
      .createQueryBuilder('hr')
      .innerJoin('hr.reservacion', 'r')
      .where('hr.habitacionId = :habitacionId', { habitacionId })
      .andWhere('r.fechaIngreso < :hasta', { hasta })
      .andWhere('r.fechaSalida > :desde', { desde })
      .andWhere(`r.estado NOT IN (:...estados)`, {
        estados: ['cancelada', 'no_show'],
      });

    if (excluyendoReservacionId) {
      qb.andWhere('r.id != :excluyendoReservacionId', { excluyendoReservacionId });
    }

    const count = await qb.getCount();
    return count === 0;
  }
}
