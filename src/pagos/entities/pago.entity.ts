import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';

@Entity('pago')
export class Pago {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto!: number;

  @Column({ length: 30 })
  metodo!: string;

  @Column({ length: 20, default: 'pendiente' })
  estado!: string;

  @Column({ length: 100, nullable: true })
  referencia?: string;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @Column()
  reservacionId!: number;

  @ManyToOne(() => Reservation, (reservation) => reservation.pagos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservacionId' })
  reservacion!: Reservation;

  @CreateDateColumn()
  fechaPago!: Date;
}