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

  async create(dto: CreateHabitacionDto): Promise<Habitacion> {
    // Verificar que el tipo existe
    await this.tipoHabitacionService.findOne(dto.tipoId);

    // Verificar que el número de habitación no esté duplicado
    const existe = await this.habitacionRepo.findOne({
      where: { numero: dto.numero },
    });
    if (existe) {
      throw new BadRequestException(`Ya existe una habitación con el número ${dto.numero}`);
    }

    const habitacion = this.habitacionRepo.create(dto);
    return this.habitacionRepo.save(habitacion);
  }

  // ── Listar ────────────────────────────────────────────────────────────────

  async findAll(): Promise<Habitacion[]> {
    return this.habitacionRepo.find({
      relations: { tipo: true },
      order: { piso: 'ASC', numero: 'ASC' },
    });
  }

  // ── Listar disponibles ────────────────────────────────────────────────────

  async findDisponibles(desde?: string, hasta?: string): Promise<Habitacion[]> {
    if (desde || hasta) {
      return this.findDisponiblesPorRango(desde!, hasta!);
    }

    return this.habitacionRepo.find({
      where: { estado: 'disponible' },
      relations: { tipo: true },
      order: { piso: 'ASC', numero: 'ASC' },
    });
  }

  async findDisponiblesPorRango(desde: string, hasta: string): Promise<Habitacion[]> {
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
      .where("h.estado NOT IN ('fuera_de_servicio', 'mantenimiento')")
      .andWhere(`h.id NOT IN (${subquery.getQuery()})`)
      .setParameters(subquery.getParameters())
      .orderBy('h.piso', 'ASC')
      .addOrderBy('h.numero', 'ASC')
      .getMany();
  }

  // ── Obtener una ───────────────────────────────────────────────────────────

  async findOne(id: number): Promise<Habitacion> {
    const habitacion = await this.habitacionRepo.findOne({
      where: { id },
      relations: { tipo: true },
    });
    if (!habitacion) throw new NotFoundException(`Habitación #${id} no encontrada`);
    return habitacion;
  }

  // ── Actualizar ────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateHabitacionDto): Promise<Habitacion> {
    const habitacion = await this.findOne(id);

    if (dto.tipoId) await this.tipoHabitacionService.findOne(dto.tipoId);

    if (dto.numero && dto.numero !== habitacion.numero) {
      const existe = await this.habitacionRepo.findOne({
        where: { numero: dto.numero },
      });
      if (existe) {
        throw new BadRequestException(`Ya existe una habitación con el número ${dto.numero}`);
      }
    }

    Object.assign(habitacion, dto);
    return this.habitacionRepo.save(habitacion);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async remove(id: number): Promise<void> {
    const habitacion = await this.findOne(id);
    await this.habitacionRepo.remove(habitacion);
  }

  // ── Ocupación por fecha ───────────────────────────────────────────────────

  async findOcupacion(fecha: string) {
    if (!fecha || isNaN(Date.parse(fecha))) {
      throw new BadRequestException('El parámetro fecha debe ser una fecha válida (YYYY-MM-DD)');
    }

    const asignaciones = await this.huespedReservacionRepo
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
      .andWhere('reservacion.fechaIngreso <= :fecha', { fecha })
      .andWhere('reservacion.fechaSalida > :fecha', { fecha })
      .andWhere("reservacion.estado NOT IN ('cancelada', 'no_show')")
      .getMany();

    return asignaciones.map((hr) => ({
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
    }));
  }

  // ── Gestión de estado físico ──────────────────────────────────────────────

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