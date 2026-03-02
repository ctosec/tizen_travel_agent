import { Controller, Get, Param } from '@nestjs/common';
import { DestinationService } from './destination.service.js';

@Controller('destination')
export class DestinationController {
  constructor(private readonly destinationService: DestinationService) {}

  @Get(':country/:city')
  async getDestination(
    @Param('country') country: string,
    @Param('city') city: string,
  ) {
    const data = await this.destinationService.getDestination(country, city);
    return { success: true, data };
  }
}
