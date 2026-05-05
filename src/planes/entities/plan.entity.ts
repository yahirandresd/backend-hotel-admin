import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToMany,
} from 'typeorm';
import { PlanActividad } from './plan-actividad.entity';
import { PlanServicio } from './plan-servicio.entity';

@Entity('plan')
export class Plan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio!: number;

  @Column()
  noches!: number;

  @Column({ default: true })
  activo!: boolean;

  @OneToMany(() => PlanActividad, (pa) => pa.plan, {
    cascade: true,
    eager: true,
  })
  actividades!: PlanActividad[];

  @OneToMany(() => PlanServicio, (ps) => ps.plan, {
    cascade: true,
    eager: true,
  })
  servicios!: PlanServicio[];

  @CreateDateColumn()
  createdAt!: Date;
}