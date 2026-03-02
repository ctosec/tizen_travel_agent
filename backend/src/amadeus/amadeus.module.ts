import { Module } from '@nestjs/common';
import { AmadeusService } from './amadeus.service.js';

@Module({
  providers: [AmadeusService],
  exports: [AmadeusService],
})
export class AmadeusModule {}
