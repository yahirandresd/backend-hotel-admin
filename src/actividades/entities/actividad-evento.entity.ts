import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Actividad } from './actividad.entity';
import { ActividadEventoGasto } from './actividad-evento-gasto.entity';

@Entity('actividad_evento')
export class ActividadEvento {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ nullable: true })
  cuposDisponibles?: number;

  @Column({ length: 20, default: 'programada' })
  estado!: string;

  @ManyToOne(() => Actividad, (actividad) => actividad.eventos)
  @JoinColumn({ name: 'actividadId' })
  actividad!: Actividad;

  @Column()
  actividadId!: number;

  @OneToMany(() => ActividadEventoGasto, (gasto) => gasto.evento, {
    cascade: true,
    eager: true,
  })
  gastos!: ActividadEventoGasto[];
}