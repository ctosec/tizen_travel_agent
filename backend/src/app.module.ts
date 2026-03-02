import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmadeusModule } from './amadeus/amadeus.module.js';
import { FlightsModule } from './flights/flights.module.js';
import { HotelsModule } from './hotels/hotels.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { GeminiModule } from './gemini/gemini.module.js';
import { PlacesModule } from './places/places.module.js';
import { DestinationModule } from './destination/destination.module.js';
import { ItineraryModule } from './itinerary/itinerary.module.js';
import { ServerInfoController } from './server-info.controller.js';
import { Booking } from './entities/booking.entity.js';
import { PaymentSession } from './entities/payment-session.entity.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', ''),
        database: configService.get<string>('DATABASE_NAME', 'travel_agent_v2'),
        entities: [Booking, PaymentSession],
        synchronize: true,
      }),
    }),
    AmadeusModule,
    FlightsModule,
    HotelsModule,
    PaymentsModule,
    BookingsModule,
    GeminiModule,
    PlacesModule,
    DestinationModule,
    ItineraryModule,
  ],
  controllers: [ServerInfoController],
})
export class AppModule {}
