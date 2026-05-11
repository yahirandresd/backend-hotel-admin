import {
  Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,
  ) {}

  // ── Crear ─────────────────────────────────────────────────────────────────

  async create(dto: CreatePagoDto): Promise<Pago> {
    const pago = this.pagoRepo.create(dto);
    return this.pagoRepo.save(pago);
  }

  // ── Listar todos ──────────────────────────────────────────────────────────

  async findAll(): Promise<Pago[]> {
    return this.pagoRepo.find({
      order: { fechaPago: 'DESC' },
    });
  }

  // ── Listar por reservación ────────────────────────────────────────────────

  async findByReservacion(reservacionId: number): Promise<Pago[]> {
    return this.pagoRepo.find({
      where: { reservacionId },
      order: { fechaPago: 'DESC' },
    });
  }

  // ── Obtener uno ───────────────────────────────────────────────────────────

  async findOne(id: number): Promise<Pago> {
    const pago = await this.pagoRepo.findOne({ where: { id } });
    if (!pago) throw new NotFoundException(`Pago #${id} no encontrado`);
    return pago;
  }

  // ── Actualizar ────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdatePagoDto): Promise<Pago> {
    const pago = await this.findOne(id);
    Object.assign(pago, dto);
    return this.pagoRepo.save(pago);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async remove(id: number): Promise<void> {
    const pago = await this.findOne(id);
    await this.pagoRepo.remove(pago);
  }

  // ── Total pagado por reservación ──────────────────────────────────────────

  async totalPorReservacion(reservacionId: number): Promise<number> {
    const result = await this.pagoRepo
      .createQueryBuilder('pago')
      .select('SUM(pago.monto)', 'total')
      .where('pago.reservacionId = :reservacionId', { reservacionId })
      .andWhere('pago.estado = :estado', { estado: 'completado' })
      .getRawOne();

    return Number(result?.total ?? 0);
  }
}