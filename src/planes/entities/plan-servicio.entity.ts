import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Plan } from './plan.entity';
import { Servicio } from '../../servicios/entities/servicio.entity';

@Entity('plan_servicio')
export class PlanServicio {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: 1 })
  cantidad!: number;

  @ManyToOne(() => Plan, (plan) => plan.servicios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan!: Plan;

  @Column()
  planId!: number;

  @ManyToOne(() => Servicio, { eager: true })
  @JoinColumn({ name: 'servicioId' })
  servicio!: Servicio;

  @Column()
  servicioId!: number;
}