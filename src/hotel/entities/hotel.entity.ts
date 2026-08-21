import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('hotel')
export class Hotel {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  nombre!: string;

  @Column({ length: 60, unique: true })
  slug!: string;

  @Column({ length: 160, nullable: true })
  nombreLegal?: string;

  @Column({ length: 30, nullable: true })
  nit?: string;

  @Column({ length: 120, nullable: true })
  email?: string;

  @Column({ length: 30, nullable: true })
  telefono?: string;

  @Column({ length: 200, nullable: true })
  direccion?: string;

  @Column({ length: 100, nullable: true })
  ciudad?: string;

  @Column({ length: 2, default: 'CO' })
  pais!: string;

  @Column({ length: 50, default: 'America/Bogota' })
  timezone!: string;

  @Column({ length: 3, default: 'COP' })
  moneda!: string;

  @Column({ type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ type: 'time', default: '15:00:00' })
  checkInHora!: string;

  @Column({ type: 'time', default: '12:00:00' })
  checkOutHora!: string;

  @Column({ type: 'text', nullable: true })
  politicaCancelacion?: string;

  @Column({ default: true })
  activo!: boolean;

  @Column({ type: 'text', nullable: true })
  notasInternas?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
