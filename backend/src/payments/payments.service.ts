import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('TOSS_SECRET_KEY', '');
  }

  async confirmTossPayment(
    paymentKey: string,
    orderId: string,
    amount: number,
    selectedMethod?: string,
  ): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
    const skipPayment = this.configService.get<string>('SKIP_TOSS_PAYMENT', 'false');
    if (skipPayment === 'true') {
      this.logger.log(`[TEST MODE] Skipping Toss payment for order ${orderId}, amount ${amount}, method ${selectedMethod}`);

      const baseData: Record<string, unknown> = {
        paymentKey,
        orderId,
        amount,
        status: 'DONE',
        approvedAt: new Date().toISOString(),
        totalAmount: amount,
        currency: 'KRW',
        country: 'KR',
        suppliedAmount: Math.round(amount / 1.1),
        vat: amount - Math.round(amount / 1.1),
      };

      const method = (selectedMethod || '').toLowerCase();
      const providerMap: Record<string, string> = {
        kakaopay: '\uCE74\uCE74\uC624\uD398\uC774',
        naverpay: '\uB124\uC774\uBC84\uD398\uC774',
        samsungpay: '\uC0BC\uC131\uD398\uC774',
        tosspay: '\uD1A0\uC2A4\uD398\uC774',
      };
      const matchedProvider = providerMap[method] || null;

      if (matchedProvider) {
        baseData.method = '\uAC04\uD3B8\uACB0\uC81C';
        baseData.easyPay = { provider: matchedProvider, amount, discountAmount: 0 };
      } else {
        baseData.method = '\uCE74\uB4DC';
        baseData.easyPay = null;
      }

      baseData.card = {
        issuerCode: '11',
        number: '4111****1111',
        installmentPlanMonths: 0,
        approveNo: String(Math.floor(10000000 + Math.random() * 90000000)),
        cardType: '\uC2E0\uC6A9',
        amount,
      };

      return { success: true, data: baseData };
    }

    try {
      const encodedKey = Buffer.from(this.secretKey + ':').toString('base64');

      const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${encodedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        this.logger.error('Toss payment confirmation failed:', data);
        return { success: false, error: (data.message as string) || 'Payment confirmation failed' };
      }

      return { success: true, data };
    } catch (error: unknown) {
      this.logger.error('Toss payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed',
      };
    }
  }
}
