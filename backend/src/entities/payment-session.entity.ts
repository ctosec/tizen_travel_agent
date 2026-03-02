import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payment_sessions')
export class PaymentSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderId: string;

  @Column({ default: 'PENDING' })
  status: string; // PENDING | SUCCESS | FAIL | EXPIRED

  @Column({ type: 'int' })
  amount: number;

  @Column()
  orderName: string;

  @Column()
  bookingType: string; // flight | hotel

  @Column({ type: 'jsonb', nullable: true })
  bookingData: Record<string, unknown>;

  @Column({ nullable: true })
  selectedMethod: string;

  @Column({ nullable: true })
  paymentKey: string;

  @Column({ type: 'jsonb', nullable: true })
  resultData: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;
}
