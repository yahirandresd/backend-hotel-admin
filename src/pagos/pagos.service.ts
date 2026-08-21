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

  async create(dto: CreatePagoDto, hotelId: number): Promise<Pago> {
    const pago = this.pagoRepo.create({ ...dto, hotelId });
    return this.pagoRepo.save(pago);
  }

  // ── Listar todos ──────────────────────────────────────────────────────────

  async findAll(hotelId: number): Promise<Pago[]> {
    return this.pagoRepo.find({
      where: { hotelId },
      order: { fechaPago: 'DESC' },
    });
  }

  // ── Listar por reservación ────────────────────────────────────────────────

  async findByReservacion(reservacionId: number, hotelId: number): Promise<Pago[]> {
    return this.pagoRepo.find({
      where: { reservacionId, hotelId },
      order: { fechaPago: 'DESC' },
    });
  }

  // ── Obtener uno ───────────────────────────────────────────────────────────

  async findOne(id: number, hotelId: number): Promise<Pago> {
    const pago = await this.pagoRepo.findOne({ where: { id, hotelId } });
    if (!pago) throw new NotFoundException(`Pago #${id} no encontrado`);
    return pago;
  }

  // ── Actualizar ────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdatePagoDto, hotelId: number): Promise<Pago> {
    const pago = await this.findOne(id, hotelId);
    Object.assign(pago, dto);
    return this.pagoRepo.save(pago);
  }

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async remove(id: number, hotelId: number): Promise<void> {
    const pago = await this.findOne(id, hotelId);
    await this.pagoRepo.remove(pago);
  }

  // ── Total pagado por reservación ──────────────────────────────────────────

  async totalPorReservacion(reservacionId: number, hotelId: number): Promise<number> {
    const result = await this.pagoRepo
      .createQueryBuilder('pago')
      .select('SUM(pago.monto)', 'total')
      .where('pago.reservacionId = :reservacionId', { reservacionId })
      .andWhere('pago.hotelId = :hotelId', { hotelId })
      .andWhere('pago.estado = :estado', { estado: 'completado' })
      .getRawOne();

    return Number(result?.total ?? 0);
  }
}
