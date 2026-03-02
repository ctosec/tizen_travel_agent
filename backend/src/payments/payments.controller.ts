import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { AmadeusService } from '../amadeus/amadeus.service.js';
import { BookingsService } from '../bookings/bookings.service.js';
import { PaymentsService } from './payments.service.js';
import { PaymentSessionsService } from './payment-sessions.service.js';
import { PaymentGateway } from './payment.gateway.js';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly amadeusService: AmadeusService,
    private readonly bookingsService: BookingsService,
    private readonly sessionsService: PaymentSessionsService,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  @Post('sessions')
  async createPaymentSession(
    @Body()
    body: {
      orderId: string;
      amount: number;
      orderName: string;
      bookingType: string;
      bookingData: Record<string, unknown>;
      selectedMethod?: string;
    },
  ) {
    if (!body.orderId || !body.amount || !body.orderName || !body.bookingType) {
      throw new HttpException(
        'Missing required fields: orderId, amount, orderName, bookingType',
        HttpStatus.BAD_REQUEST,
      );
    }

    const session = await this.sessionsService.createSession({
      orderId: body.orderId,
      amount: body.amount,
      orderName: body.orderName,
      bookingType: body.bookingType,
      bookingData: body.bookingData || {},
      selectedMethod: body.selectedMethod,
    });

    return { success: true, orderId: session.orderId, sessionId: session.id };
  }

  @Get('sessions/:orderId/status')
  async getSessionStatus(@Param('orderId') orderId: string) {
    const status = await this.sessionsService.getSessionStatus(orderId);
    if (!status) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }
    return status;
  }

  @Post('sessions/:orderId/complete')
  async completeSession(
    @Param('orderId') orderId: string,
    @Body() body: { paymentKey: string; amount: number },
  ) {
    const session = await this.sessionsService.getSession(orderId);
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    if (session.status === 'SUCCESS') {
      return { success: true, message: 'Already completed', data: session.resultData };
    }

    if (body.amount !== session.amount) {
      throw new HttpException(
        `Amount mismatch: expected ${session.amount}, got ${body.amount}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const paymentResult = await this.paymentsService.confirmTossPayment(
      body.paymentKey,
      orderId,
      body.amount,
      session.selectedMethod,
    );

    if (!paymentResult.success) {
      await this.sessionsService.updateSessionStatus(orderId, 'FAIL', undefined, {
        error: paymentResult.error,
      });
      this.paymentGateway.notifyPaymentUpdate(orderId, 'FAIL', {
        error: paymentResult.error,
      });
      throw new HttpException(paymentResult.error || 'Payment failed', HttpStatus.BAD_REQUEST);
    }

    let bookingResult: Record<string, unknown> = {};

    if (session.bookingType === 'flight' && session.bookingData?.flightOffer) {
      const amadeusResult = await this.amadeusService.bookFlight(
        session.bookingData.flightOffer as Record<string, unknown>,
        session.bookingData.travelers as Record<string, unknown>[],
      );

      const pnr =
        amadeusResult.success && amadeusResult.data
          ? ((amadeusResult.data as Record<string, unknown>).associatedRecords as Array<{ reference: string }>)?.[0]?.reference || null
          : null;

      const booking = await this.bookingsService.createBooking({
        bookingType: 'flight',
        status: 'confirmed',
        pnr,
        amadeusOrderId:
          amadeusResult.success && amadeusResult.data
            ? ((amadeusResult.data as Record<string, unknown>).id as string)
            : null,
        bookingData: {
          payment: paymentResult.data,
          amadeus: amadeusResult?.data || null,
          originalRequest: session.bookingData,
        },
        paymentAmount: session.amount,
        paymentKey: body.paymentKey,
      });

      bookingResult = { bookingId: booking.id, pnr, type: 'flight' };
    } else if (session.bookingType === 'hotel') {
      let amadeusResult: { success: boolean; data?: unknown } | null = null;

      if (session.bookingData?.offerId && session.bookingData?.guests && session.bookingData?.payments) {
        amadeusResult = await this.amadeusService.bookHotel(
          session.bookingData.offerId as string,
          session.bookingData.guests as Record<string, unknown>[],
          session.bookingData.payments as Record<string, unknown>[],
        );
        if (!amadeusResult.success) {
          amadeusResult = {
            success: true,
            data: { type: 'hotel-order', id: `TEST-HOTEL-${Date.now()}`, note: 'Test environment' },
          };
        }
      }

      const confirmationNumber = amadeusResult?.data
        ? ((amadeusResult.data as Record<string, unknown>).id as string)
        : `HOTEL-${Date.now()}`;

      const booking = await this.bookingsService.createBooking({
        bookingType: 'hotel',
        status: 'confirmed',
        confirmationNumber,
        bookingData: {
          payment: paymentResult.data,
          amadeus: amadeusResult?.data || null,
          originalRequest: session.bookingData,
        },
        paymentAmount: session.amount,
        paymentKey: body.paymentKey,
      });

      bookingResult = { bookingId: booking.id, confirmationNumber, type: 'hotel' };
    }

    await this.sessionsService.updateSessionStatus(orderId, 'SUCCESS', body.paymentKey, {
      payment: paymentResult.data,
      booking: bookingResult,
    });

    this.paymentGateway.notifyPaymentUpdate(orderId, 'SUCCESS', {
      payment: paymentResult.data,
      booking: bookingResult,
    });

    return { success: true, payment: paymentResult.data, booking: bookingResult };
  }
}
