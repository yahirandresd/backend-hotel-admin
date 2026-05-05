import {
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actividad } from './entities/actividad.entity';
import { ActividadEvento } from './entities/actividad-evento.entity';
import { ActividadEventoGasto } from './entities/actividad-evento-gasto.entity';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { CreateActividadEventoDto } from './dto/create-actividad-evento.dto';
import { UpdateActividadEventoDto } from './dto/update-actividad-evento.dto';

@Injectable()
export class ActividadesService {
  constructor(
    @InjectRepository(Actividad)
    private readonly actividadRepo: Repository<Actividad>,

    @InjectRepository(ActividadEvento)
    private readonly eventoRepo: Repository<ActividadEvento>,

    @InjectRepository(ActividadEventoGasto)
    private readonly gastoRepo: Repository<ActividadEventoGasto>,
  ) {}

  // ── Actividades ───────────────────────────────────────────────────────────

  async create(dto: CreateActividadDto): Promise<Actividad> {
    const actividad = this.actividadRepo.create(dto);
    return this.actividadRepo.save(actividad);
  }

  async findAll(): Promise<Actividad[]> {
    return this.actividadRepo.find({
      order: { nombre: 'ASC' },
    });
  }

  async findActivas(): Promise<Actividad[]> {
    return this.actividadRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Actividad> {
    const actividad = await this.actividadRepo.findOne({ where: { id } });
    if (!actividad) throw new NotFoundException(`Actividad #${id} no encontrada`);
    return actividad;
  }

  async update(id: number, dto: UpdateActividadDto): Promise<Actividad> {
    const actividad = await this.findOne(id);
    Object.assign(actividad, dto);
    return this.actividadRepo.save(actividad);
  }

  async remove(id: number): Promise<void> {
    const actividad = await this.findOne(id);
    await this.actividadRepo.remove(actividad);
  }

  // ── Eventos ───────────────────────────────────────────────────────────────

  async createEvento(dto: CreateActividadEventoDto): Promise<ActividadEvento> {
    await this.findOne(dto.actividadId);

    const { gastos: gastosDto, ...eventoData } = dto;

    const evento = this.eventoRepo.create(eventoData);

    if (gastosDto && gastosDto.length > 0) {
      evento.gastos = gastosDto.map((g) => this.gastoRepo.create(g));
    } else {
      evento.gastos = [];
    }

    return this.eventoRepo.save(evento);
  }

  async findEventos(actividadId: number): Promise<ActividadEvento[]> {
    await this.findOne(actividadId);
    return this.eventoRepo.find({
      where: { actividadId },
      relations: { gastos: true },
      order: { fecha: 'DESC' },
    });
  }

  async findEvento(id: number): Promise<ActividadEvento> {
    const evento = await this.eventoRepo.findOne({
      where: { id },
      relations: { gastos: true },
    });
    if (!evento) throw new NotFoundException(`Evento #${id} no encontrado`);
    return evento;
  }

  async updateEvento(id: number, dto: UpdateActividadEventoDto): Promise<ActividadEvento> {
    const evento = await this.findEvento(id);
    const { gastos: gastosDto, ...eventoData } = dto;
    Object.assign(evento, eventoData);

    if (gastosDto) {
      await this.gastoRepo.delete({ eventoId: id });
      evento.gastos = gastosDto.map((g) => this.gastoRepo.create({ ...g, eventoId: id }));
    }

    return this.eventoRepo.save(evento);
  }

  async removeEvento(id: number): Promise<void> {
    const evento = await this.findEvento(id);
    await this.eventoRepo.remove(evento);
  }

  // ── Utilidad por evento ───────────────────────────────────────────────────

  async calcularUtilidadEvento(eventoId: number): Promise<{
    totalIngresos: number;
    totalGastos:   number;
    utilidad:      number;
  }> {
    const evento = await this.findEvento(eventoId);

    const totalGastos = evento.gastos.reduce(
      (sum, g) => sum + Number(g.monto), 0,
    );

    const result = await this.eventoRepo
      .createQueryBuilder('evento')
      .leftJoin('evento.reservacionActividades', 'ra')
      .select('SUM(ra.precioUnitario * ra.cantidadPersonas)', 'totalIngresos')
      .where('evento.id = :eventoId', { eventoId })
      .getRawOne();

    const totalIngresos = Number(result?.totalIngresos ?? 0);
    const utilidad      = totalIngresos - totalGastos;

    return { totalIngresos, totalGastos, utilidad };
  }
}