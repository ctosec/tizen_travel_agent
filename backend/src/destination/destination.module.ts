import { Module } from '@nestjs/common';
import { GeminiModule } from '../gemini/gemini.module.js';
import { PlacesModule } from '../places/places.module.js';
import { DestinationController } from './destination.controller.js';
import { DestinationService } from './destination.service.js';

@Module({
  imports: [GeminiModule, PlacesModule],
  controllers: [DestinationController],
  providers: [DestinationService],
  exports: [DestinationService],
})
export class DestinationModule {}
