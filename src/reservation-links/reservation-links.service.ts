import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { ReservationLink } from './entities/reservation-link.entity';

@Injectable()
export class ReservationLinksService {
  constructor(
    @InjectRepository(ReservationLink)
    private readonly linkRepository: Repository<ReservationLink>,
  ) {}

  // ── Crear link ────────────────────────────────────────────────────────────

  async create(hotelId: number): Promise<ReservationLink> {
    const code = await this.generateUniqueCode();
    const link = this.linkRepository.create({ code, hotelId });
    return this.linkRepository.save(link);
  }

  // ── Validar link ──────────────────────────────────────────────────────────

  async validate(code: string): Promise<ReservationLink> {
    const link = await this.linkRepository.findOne({ where: { code } });

    if (!link) {
      throw new NotFoundException('El enlace no es válido');
    }

    if (link.reservationId) {
      throw new BadRequestException('Este enlace ya fue utilizado');
    }

    return link;
  }

  // ── Marcar como usado ─────────────────────────────────────────────────────

  async markAsUsed(code: string, reservationId: number): Promise<void> {
    await this.linkRepository.update({ code }, { reservationId });
  }

  // ── Listar todos ──────────────────────────────────────────────────────────

  async findAll(hotelId: number): Promise<ReservationLink[]> {
    return this.linkRepository.find({
      where: { hotelId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Helper ────────────────────────────────────────────────────────────────

  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let exists: boolean;

    do {
      code   = randomBytes(4).toString('hex').slice(0, 7);
      exists = !!(await this.linkRepository.findOne({ where: { code } }));
    } while (exists);

    return code;
  }
}