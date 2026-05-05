import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
} from 'typeorm';
import { ActividadEvento } from './actividad-evento.entity';

@Entity('actividad')
export class Actividad {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio!: number;

  @Column({ nullable: true })
  duracionHoras?: number;

  @Column({ nullable: true })
  cupoMaximo?: number;

  @Column({ default: true })
  activo!: boolean;

  @OneToMany(() => ActividadEvento, (evento) => evento.actividad)
  eventos!: ActividadEvento[];
}