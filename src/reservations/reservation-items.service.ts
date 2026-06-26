import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from '../servicios/entities/servicio.entity';
import { ActividadEvento } from '../actividades/entities/actividad-evento.entity';
import { ReservacionServicio } from './entities/reservacion-servicio.entity';
import { ReservacionActividad } from '../actividades/entities/reservacion-actividad.entity';
import { AgregarServicioDto, AgregarActividadDto } from './dto/admin-reservation.dto';

@Injectable()
export class ReservationItemsService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepo: Repository<Servicio>,

    @InjectRepository(ActividadEvento)
    private readonly eventoRepo: Repository<ActividadEvento>,

    @InjectRepository(ReservacionServicio)
    private readonly reservacionServicioRepo: Repository<ReservacionServicio>,

    @InjectRepository(ReservacionActividad)
    private readonly reservacionActividadRepo: Repository<ReservacionActividad>,
  ) {}

  async agregarServicio(reservacionId: number, dto: AgregarServicioDto): Promise<void> {
    const servicio = await this.servicioRepo.findOne({ where: { id: dto.servicioId } });
    if (!servicio) {
      throw new NotFoundException(`Servicio #${dto.servicioId} no encontrado`);
    }

    await this.reservacionServicioRepo.save(
      this.reservacionServicioRepo.create({
        reservacionId,
        servicioId:     dto.servicioId,
        cantidad:       dto.cantidad ?? 1,
        precioUnitario: Number(servicio.precio),
        fechaServicio:  dto.fecha ?? undefined,
        notas:          dto.notas ?? undefined,
      }),
    );
  }

  async agregarActividad(reservacionId: number, dto: AgregarActividadDto): Promise<void> {
    const evento = await this.eventoRepo.findOne({
      where: { id: dto.eventoId },
      relations: { actividad: true },
    });
    if (!evento) {
      throw new NotFoundException(`Evento #${dto.eventoId} no encontrado`);
    }

    await this.reservacionActividadRepo.save(
      this.reservacionActividadRepo.create({
        reservacionId,
        eventoId:         dto.eventoId,
        cantidadPersonas: dto.cantidadPersonas,
        precioUnitario:   Number(evento.actividad.precio),
        notas:            dto.notas ?? undefined,
      }),
    );
  }
}
