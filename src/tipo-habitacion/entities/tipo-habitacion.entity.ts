import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToMany,
} from 'typeorm';
import { Habitacion } from '../../habitacion/entities/habitacion.entity';

@Entity('tipo_habitacion')
export class TipoHabitacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column()
  capacidad!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioBase!: number;

  @OneToMany(() => Habitacion, (habitacion) => habitacion.tipo)
  habitaciones!: Habitacion[];

  @CreateDateColumn()
  createdAt!: Date;
}