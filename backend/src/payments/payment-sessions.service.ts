import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PaymentSession } from '../entities/payment-session.entity.js';

interface CreateSessionData {
  orderId: string;
  amount: number;
  orderName: string;
  bookingType: string;
  bookingData: Record<string, unknown>;
  selectedMethod?: string;
}

@Injectable()
export class PaymentSessionsService {
  private readonly logger = new Logger(PaymentSessionsService.name);

  constructor(
    @InjectRepository(PaymentSession)
    private readonly sessionRepository: Repository<PaymentSession>,
  ) {}

  async createSession(data: CreateSessionData): Promise<PaymentSession> {
    const existing = await this.sessionRepository.findOne({
      where: { orderId: data.orderId },
    });
    if (existing) {
      this.logger.warn(`Session already exists for orderId ${data.orderId}`);
      return existing;
    }

    const session = this.sessionRepository.create({
      orderId: data.orderId,
      amount: data.amount,
      orderName: data.orderName,
      bookingType: data.bookingType,
      bookingData: data.bookingData,
      selectedMethod: data.selectedMethod,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const saved = await this.sessionRepository.save(session);
    this.logger.log(`Created payment session: ${data.orderId}`);
    return saved;
  }

  async getSession(orderId: string): Promise<PaymentSession | null> {
    return this.sessionRepository.findOne({ where: { orderId } });
  }

  async getSessionStatus(
    orderId: string,
  ): Promise<{ status: string; data?: Record<string, unknown> } | null> {
    const session = await this.sessionRepository.findOne({ where: { orderId } });
    if (!session) return null;

    if (session.status === 'PENDING' && new Date() > session.expiresAt) {
      session.status = 'EXPIRED';
      await this.sessionRepository.save(session);
    }

    return { status: session.status, data: session.resultData || undefined };
  }

  async updateSessionStatus(
    orderId: string,
    status: string,
    paymentKey?: string,
    resultData?: Record<string, unknown>,
  ): Promise<PaymentSession | null> {
    const session = await this.sessionRepository.findOne({ where: { orderId } });
    if (!session) return null;

    if (session.status === 'SUCCESS') {
      this.logger.warn(`Session ${orderId} already SUCCESS, ignoring update to ${status}`);
      return session;
    }

    session.status = status;
    if (paymentKey) session.paymentKey = paymentKey;
    if (resultData) session.resultData = resultData;

    const saved = await this.sessionRepository.save(session);
    this.logger.log(`Updated session ${orderId} to ${status}`);
    return saved;
  }

  async cleanExpiredSessions(): Promise<number> {
    const result = await this.sessionRepository.update(
      { status: 'PENDING', expiresAt: LessThan(new Date()) },
      { status: 'EXPIRED' },
    );
    return result.affected || 0;
  }
}
