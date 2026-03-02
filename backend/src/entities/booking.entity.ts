import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingType: string; // 'flight' | 'hotel'

  @Column({ default: 'confirmed' })
  status: string;

  @Column({ nullable: true })
  pnr: string;

  @Column({ nullable: true })
  confirmationNumber: string;

  @Column({ nullable: true })
  amadeusOrderId: string;

  @Column('jsonb')
  bookingData: Record<string, unknown>;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  paymentAmount: number;

  @Column({ nullable: true })
  paymentKey: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
