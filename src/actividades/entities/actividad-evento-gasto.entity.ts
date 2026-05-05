import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ActividadEvento } from './actividad-evento.entity';

@Entity('actividad_evento_gasto')
export class ActividadEventoGasto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150 })
  concepto!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto!: number;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @ManyToOne(() => ActividadEvento, (evento) => evento.gastos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventoId' })
  evento!: ActividadEvento;

  @Column()
  eventoId!: number;
}