import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ActividadEvento } from './actividad-evento.entity';

@Entity('reservacion_actividad')
export class ReservacionActividad {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  reservacionId!: number;

  @ManyToOne(() => ActividadEvento, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventoId' })
  evento!: ActividadEvento;

  @Column()
  eventoId!: number;

  @Column()
  cantidadPersonas!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioUnitario!: number;

  @Column({ type: 'text', nullable: true })
  notas?: string;
}