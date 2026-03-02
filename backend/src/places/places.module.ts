import { Module } from '@nestjs/common';
import { PlacesService } from './places.service.js';
import { PlacesController } from './places.controller.js';

@Module({
  controllers: [PlacesController],
  providers: [PlacesService],
  exports: [PlacesService],
})
export class PlacesModule {}
