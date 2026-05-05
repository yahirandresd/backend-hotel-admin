import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { TipoHabitacion } from '../../tipo-habitacion/entities/tipo-habitacion.entity';

@Entity('habitacion')
export class Habitacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 10 })
  numero!: string;

  @Column()
  piso!: number;

  @Column({
    length: 20,
    default: 'disponible',
  })
  estado!: string;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @ManyToOne(() => TipoHabitacion, (tipo) => tipo.habitaciones)
  @JoinColumn({ name: 'tipoId' })
  tipo!: TipoHabitacion;

  @Column()
  tipoId!: number;
}