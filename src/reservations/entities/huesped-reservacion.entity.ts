import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Reservation } from './reservation.entity';
import { Habitacion } from '../../habitacion/entities/habitacion.entity';

@Entity('huesped_reservacion')
export class HuespedReservacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'hotel_id', nullable: true })
  hotelId?: number;

  // FK al guest (datos del huésped en esa reservación)
  @Column()
  guestId!: number;

  // FK a la reservación
  @ManyToOne(() => Reservation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservacionId' })
  reservacion!: Reservation;

  @Column()
  reservacionId!: number;

  // Habitación asignada para ESTA estadía
  @ManyToOne(() => Habitacion, { nullable: true, eager: true })
  @JoinColumn({ name: 'habitacionId' })
  habitacion?: Habitacion;

  @Column({ nullable: true })
  habitacionId?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioNoche?: number;

  @Column({ default: false })
  esTitular!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}