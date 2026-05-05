import {
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from './entities/servicio.entity';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepo: Repository<Servicio>,
  ) {}

  // ── Crear ─────────────────────────────────────────────────────────────────

  async create(dto: CreateServicioDto): Promise<Servicio> {
    const servicio = this.servicioRepo.create(dto);
    return this.servicioRepo.save(servicio);
  }

  // ── Listar todos ──────────────────────────────────────────────────────────

  async findAll(): Promise<Servicio[]> {
    return this.servicioRepo.find({
      order: { categoria: 'ASC', nombre: 'ASC' },
    });
  }

  // ── Listar activos ────────────────────────────────────────────────────────

  async findActivos(): Promise<Servicio[]> {
    return this.servicioRepo.find({
      where: { activo: true },
      order: { categoria: 'ASC', nombre: 'ASC' },
    });
  }

  // ── Obtener uno ───────────────────────────────────────────────────────────

  async findOne(id: number): Promise<Servicio> {
    const servicio = await this.servicioRepo.findOne({ where: { id } });
    if (!servicio) throw new NotFoundException(`Servicio #${id} no encontrado`);
    return servicio;
  }

  // ── Actualizar ────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateServicioDto): Promise<Servicio> {
    const servicio = await this.findOne(id);
    Object.assign(servicio, dto);
    return this.servicioRepo.save(servicio);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async remove(id: number): Promise<void> {
    const servicio = await this.findOne(id);
    await this.servicioRepo.remove(servicio);
  }
}