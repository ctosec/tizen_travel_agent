import { Module } from '@nestjs/common';
import { AmadeusModule } from '../amadeus/amadeus.module.js';
import { HotelsController } from './hotels.controller.js';

@Module({
  imports: [AmadeusModule],
  controllers: [HotelsController],
})
export class HotelsModule {}
