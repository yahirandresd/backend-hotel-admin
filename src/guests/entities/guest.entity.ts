import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Reservation } from '../../reservations/entities/reservation.entity';

@Entity('guests')
export class Guest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'hotel_id', nullable: true })
  hotelId?: number;

  @Column({ length: 10 })
  docType!: string;

  @Column({ length: 20 })
  docNum!: string;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ length: 100 })
  apellido!: string;

  @Column({ type: 'date' })
  fechaNac!: string;

  @Column({ length: 100, nullable: true })
  ciudadResidencia?: string;

  @Column({ length: 100, nullable: true })
  ciudadOrigen?: string;

  @Column({ length: 20, nullable: true })
  tel1?: string;

  @Column({ length: 20, nullable: true })
  tel2?: string;

  @Column({ length: 150, nullable: true })
  email?: string;

  @Column({ length: 2 })
  vacuna!: string;

  @Column({ default: false })
  esTitular!: boolean;

  @ManyToOne(() => Reservation, (reservation) => reservation.guests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reservationId' })
  reservation!: Reservation;

  @Column()
  reservationId!: number;
}