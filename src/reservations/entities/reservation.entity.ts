import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn,
} from 'typeorm';
import { Guest } from '../../guests/entities/guest.entity';
import { Plan } from '../../planes/entities/plan.entity';
import { Pago } from '../../pagos/entities/pago.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'hotel_id', nullable: true })
  hotelId?: number;

  // ── Referencia al titular ─────────────────────────────────────────────────
  @Column({ length: 20 })
  titularDocNum!: string;

  // ── Estadía ───────────────────────────────────────────────────────────────
  @Column({ type: 'date' })
  fechaIngreso!: string;

  @Column({ type: 'date' })
  fechaSalida!: string;

  @Column({ length: 100 })
  motivo!: string;

  // ── Estado ────────────────────────────────────────────────────────────────
  @Column({ length: 20, default: 'pendiente' })
  estado!: string;

  // ── Plan (opcional) ───────────────────────────────────────────────────────
  @ManyToOne(() => Plan, { nullable: true, eager: false })
  @JoinColumn({ name: 'planId' })
  plan?: Plan;

  @Column({ nullable: true })
  planId?: number;

  // ── Precio total ──────────────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  precioTotal!: number;

  // ── Canal de origen ───────────────────────────────────────────────────────
  @Column({ length: 20, default: 'web' })
  canalOrigen!: string;

  // ── Notas internas ────────────────────────────────────────────────────────
  @Column({ type: 'text', nullable: true })
  notas?: string;

  // ── Declaración ───────────────────────────────────────────────────────────
  @Column({ default: false })
  aceptaTerminos!: boolean;

  // ── Relación con huéspedes ────────────────────────────────────────────────
  @OneToMany(() => Guest, (guest) => guest.reservation, {
    cascade: true,
    eager: true,
  })
  guests!: Guest[];

  // ── Pagos ─────────────────────────────────────────────────────────────────
  @OneToMany(() => Pago, (pago) => pago.reservacion)
  pagos!: Pago[];

  // ── Auditoría ─────────────────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}