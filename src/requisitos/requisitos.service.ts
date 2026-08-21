import {
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requisito } from './entities/requisito.entity';
import { HuespedRequisito } from './entities/huesped-requisito.entity';
import { CreateRequisitoDto } from './dto/create-requisito.dto';
import { UpdateRequisitoDto } from './dto/update-requisito.dto';
import { CreateHuespedRequisitoDto } from './dto/create-huesped-requisito.dto';

@Injectable()
export class RequisitosService {
  constructor(
    @InjectRepository(Requisito)
    private readonly requisitoRepo: Repository<Requisito>,

    @InjectRepository(HuespedRequisito)
    private readonly huespedRequisitoRepo: Repository<HuespedRequisito>,
  ) {}

  // ── Requisitos ────────────────────────────────────────────────────────────

  async create(dto: CreateRequisitoDto, hotelId: number): Promise<Requisito> {
    const requisito = this.requisitoRepo.create({ ...dto, hotelId });
    return this.requisitoRepo.save(requisito);
  }

  async findAll(hotelId: number): Promise<Requisito[]> {
    return this.requisitoRepo.find({
      where: { hotelId },
      order: { nombre: 'ASC' },
    });
  }

  async findActivos(hotelId: number): Promise<Requisito[]> {
    return this.requisitoRepo.find({
      where: { hotelId, activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number, hotelId: number): Promise<Requisito> {
    const requisito = await this.requisitoRepo.findOne({ where: { id, hotelId } });
    if (!requisito) throw new NotFoundException(`Requisito #${id} no encontrado`);
    return requisito;
  }

  async update(id: number, dto: UpdateRequisitoDto, hotelId: number): Promise<Requisito> {
    const requisito = await this.findOne(id, hotelId);
    Object.assign(requisito, dto);
    return this.requisitoRepo.save(requisito);
  }

  async remove(id: number, hotelId: number): Promise<void> {
    const requisito = await this.findOne(id, hotelId);
    await this.requisitoRepo.remove(requisito);
  }

  // ── Huésped Requisito ─────────────────────────────────────────────────────

  async registrarRespuesta(dto: CreateHuespedRequisitoDto, hotelId: number): Promise<HuespedRequisito> {
    await this.findOne(dto.requisitoId, hotelId);

    // Si ya existe una respuesta para este huésped/reservación/requisito la actualiza
    const existe = await this.huespedRequisitoRepo.findOne({
      where: {
        hotelId,
        huespedId:     dto.huespedId,
        reservacionId: dto.reservacionId,
        requisitoId:   dto.requisitoId,
      },
    });

    if (existe) {
      Object.assign(existe, dto);
      return this.huespedRequisitoRepo.save(existe);
    }

    const hr = this.huespedRequisitoRepo.create({ ...dto, hotelId });
    return this.huespedRequisitoRepo.save(hr);
  }

  async findByReservacion(reservacionId: number, hotelId: number): Promise<HuespedRequisito[]> {
    return this.huespedRequisitoRepo.find({
      where: { reservacionId, hotelId },
      relations: { requisito: true },
      order: { huespedId: 'ASC' },
    });
  }

  async findByHuesped(huespedId: number, hotelId: number): Promise<HuespedRequisito[]> {
    return this.huespedRequisitoRepo.find({
      where: { huespedId, hotelId },
      relations: { requisito: true },
    });
  }
}
