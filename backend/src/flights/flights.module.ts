import { Module } from '@nestjs/common';
import { AmadeusModule } from '../amadeus/amadeus.module.js';
import { FlightsController } from './flights.controller.js';

@Module({
  imports: [AmadeusModule],
  controllers: [FlightsController],
})
export class FlightsModule {}
