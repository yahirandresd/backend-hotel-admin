import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Hotel } from './entities/hotel.entity';
import { TipoHabitacion } from '../tipo-habitacion/entities/tipo-habitacion.entity';
import { Requisito } from '../requisitos/entities/requisito.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { UpdateHotelMeDto } from './dto/update-hotel-me.dto';

@Injectable()
export class HotelService {
  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepo: Repository<Hotel>,

    private readonly dataSource: DataSource,
  ) {}

  // ── Crear ─────────────────────────────────────────────────────────────────
  // Solo superadmin. Además de la fila del hotel, bootstrapea catálogos base
  // (tipos de habitación y requisitos estándar) para que el cliente nuevo no
  // arranque con pantallas vacías.
  //
  // El superadmin no tiene hotelId propio, así que estos INSERTs no pasan por
  // la transacción de tenant normal (RequestTransactionMiddleware) — bajo RLS,
  // eso significa que `app.hotel_id` no está seteado y el WITH CHECK de las
  // tablas rechazaría la fila. Se abre aquí una transacción dedicada, con el
  // GUC fijado al hotel recién creado, solo para este bootstrap puntual.

  async create(dto: CreateHotelDto): Promise<Hotel> {
    const existente = await this.hotelRepo.findOne({ where: { slug: dto.slug } });
    if (existente) {
      throw new ConflictException(`Ya existe un hotel con el slug "${dto.slug}"`);
    }

    const hotel = await this.hotelRepo.save(this.hotelRepo.create(dto));

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.query(
        'SELECT set_config($1, $2, true)',
        ['app.hotel_id', String(hotel.id)],
      );

      await queryRunner.manager.save(TipoHabitacion, [
        { hotelId: hotel.id, nombre: 'Sencilla', capacidad: 1, precioBase: 100000 },
        { hotelId: hotel.id, nombre: 'Doble',    capacidad: 2, precioBase: 150000 },
      ]);

      await queryRunner.manager.save(Requisito, [
        { hotelId: hotel.id, nombre: 'Esquema de vacunación completo', activo: true },
      ]);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return hotel;
  }

  // ── Listar (superadmin) ──────────────────────────────────────────────────

  async findAll(): Promise<Hotel[]> {
    return this.hotelRepo.find({ order: { nombre: 'ASC' } });
  }

  // ── Obtener uno (superadmin) ─────────────────────────────────────────────

  async findOne(id: number): Promise<Hotel> {
    const hotel = await this.hotelRepo.findOne({ where: { id } });
    if (!hotel) throw new NotFoundException(`Hotel #${id} no encontrado`);
    return hotel;
  }

  // ── Actualizar (superadmin — todos los campos) ───────────────────────────

  async update(id: number, dto: UpdateHotelDto): Promise<Hotel> {
    const hotel = await this.findOne(id);
    Object.assign(hotel, dto);
    return this.hotelRepo.save(hotel);
  }

  // ── Actualizar el propio hotel (admin — campos restringidos) ─────────────

  async updateMe(hotelId: number, dto: UpdateHotelMeDto): Promise<Hotel> {
    const hotel = await this.findOne(hotelId);
    Object.assign(hotel, dto);
    return this.hotelRepo.save(hotel);
  }
}
