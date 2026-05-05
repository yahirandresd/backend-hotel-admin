import {
  Entity, PrimaryGeneratedColumn, Column,
} from 'typeorm';

@Entity('servicio')
export class Servicio {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio!: number;

  @Column({ length: 30 })
  categoria!: string;

  @Column({ default: true })
  activo!: boolean;
}