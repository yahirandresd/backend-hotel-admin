import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToMany,
} from 'typeorm';
import { HuespedRequisito } from './huesped-requisito.entity';

@Entity('requisito')
export class Requisito {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ default: true })
  activo!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => HuespedRequisito, (hr) => hr.requisito)
  huespedRequisitos!: HuespedRequisito[];
}