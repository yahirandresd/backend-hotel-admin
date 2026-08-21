import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('plan')
export class Plan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'hotel_id', nullable: true })
  hotelId?: number;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioPersona!: number;

  @Column()
  noches!: number;

  @Column({ nullable: true })
  maxPersonas?: number;

  @Column({ default: true })
  activo!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}