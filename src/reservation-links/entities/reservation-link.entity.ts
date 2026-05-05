import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('reservation_links')
export class ReservationLink {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 7 })
  code!: string;

  @Column({ nullable: true })
  reservationId?: number;

  @CreateDateColumn()
  createdAt!: Date;
}