import { Module } from '@nestjs/common';
import { GeminiModule } from '../gemini/gemini.module.js';
import { PlacesModule } from '../places/places.module.js';
import { ItineraryController } from './itinerary.controller.js';
import { ItineraryService } from './itinerary.service.js';

@Module({
  imports: [GeminiModule, PlacesModule],
  controllers: [ItineraryController],
  providers: [ItineraryService],
})
export class ItineraryModule {}
