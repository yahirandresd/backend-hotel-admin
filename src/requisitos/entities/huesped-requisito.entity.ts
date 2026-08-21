import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Requisito } from './requisito.entity';

@Entity('huesped_requisito')
export class HuespedRequisito {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'hotel_id', nullable: true })
  hotelId?: number;

  @Column()
  huespedId!: number;

  @Column()
  reservacionId!: number;

  @Column()
  respuesta!: boolean;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Requisito, (requisito) => requisito.huespedRequisitos)
  @JoinColumn({ name: 'requisitoId' })
  requisito!: Requisito;

  @Column()
  requisitoId!: number;
}