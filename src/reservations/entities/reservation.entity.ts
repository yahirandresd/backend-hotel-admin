import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Guest } from '../../guests/entities/guest.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id!: number;

  // Solo referencia al titular
  @Column({ length: 20 })
  titularDocNum!: string;

  // Estadía
  @Column({ type: 'date' })
  fechaIngreso!: string;

  @Column({ type: 'date' })
  fechaSalida!: string;

  @Column({ length: 100 })
  motivo!: string;

  @Column({ default: false })
  aceptaTerminos!: boolean;

  // Todos los huéspedes (incluido titular)
  @OneToMany(() => Guest, (guest) => guest.reservation, {
    cascade: true,
    eager: true,
  })
  guests!: Guest[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
