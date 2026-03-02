import { Body, Controller, Post } from '@nestjs/common';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ItineraryService } from './itinerary.service.js';

class GenerateItineraryDto {
  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsNumber()
  @Type(() => Number)
  duration: number;
}

@Controller('itinerary')
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Post('generate')
  async generateItinerary(@Body() dto: GenerateItineraryDto) {
    const data = await this.itineraryService.generateItinerary({
      country: dto.country,
      city: dto.city,
      startDate: dto.startDate,
      duration: dto.duration,
    });
    return { success: true, data };
  }
}
