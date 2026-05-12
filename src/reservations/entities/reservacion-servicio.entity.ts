import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Servicio } from '../../servicios/entities/servicio.entity';

@Entity('reservacion_servicio')
export class ReservacionServicio {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  reservacionId!: number;

  @ManyToOne(() => Servicio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'servicioId' })
  servicio!: Servicio;

  @Column()
  servicioId!: number;

  @Column({ default: 1 })
  cantidad!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioUnitario!: number;

  @Column({ type: 'date', nullable: true })
  fechaServicio?: string;

  @Column({ type: 'text', nullable: true })
  notas?: string;
}
