import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmadeusModule } from '../amadeus/amadeus.module.js';
import { BookingsModule } from '../bookings/bookings.module.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsCheckoutController } from './payments-checkout.controller.js';
import { PaymentsService } from './payments.service.js';
import { PaymentSessionsService } from './payment-sessions.service.js';
import { PaymentGateway } from './payment.gateway.js';
import { PaymentSession } from '../entities/payment-session.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentSession]),
    AmadeusModule,
    BookingsModule,
  ],
  controllers: [PaymentsController, PaymentsCheckoutController],
  providers: [PaymentsService, PaymentSessionsService, PaymentGateway],
  exports: [PaymentsService, PaymentSessionsService, PaymentGateway],
})
export class PaymentsModule {}
