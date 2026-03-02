import { Body, Controller, Post } from '@nestjs/common';
import { AmadeusService } from '../amadeus/amadeus.service.js';
import { FlightSearchDto } from './dto/flight-search.dto.js';
import { FlightBookDto } from './dto/flight-book.dto.js';

@Controller('flights')
export class FlightsController {
  constructor(private readonly amadeusService: AmadeusService) {}

  @Post('search')
  async searchFlights(@Body() dto: FlightSearchDto) {
    return this.amadeusService.searchFlights(
      dto.originCode,
      dto.destinationCode,
      dto.dateOfDeparture,
      dto.adults ?? 1,
      dto.travelClass ?? 'ECONOMY',
    );
  }

  @Post('book')
  async bookFlight(@Body() dto: FlightBookDto) {
    return this.amadeusService.bookFlight(dto.flightOffer, dto.travelers);
  }
}
