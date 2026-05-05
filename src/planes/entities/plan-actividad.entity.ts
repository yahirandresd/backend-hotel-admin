import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Plan } from './plan.entity';
import { Actividad } from '../../actividades/entities/actividad.entity';

@Entity('plan_actividad')
export class PlanActividad {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: 1 })
  cantidad!: number;

  @ManyToOne(() => Plan, (plan) => plan.actividades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan!: Plan;

  @Column()
  planId!: number;

  @ManyToOne(() => Actividad, { eager: true })
  @JoinColumn({ name: 'actividadId' })
  actividad!: Actividad;

  @Column()
  actividadId!: number;
}