import { Body, Controller, Post } from '@nestjs/common';
import { AmadeusService } from '../amadeus/amadeus.service.js';
import { HotelSearchDto } from './dto/hotel-search.dto.js';
import { HotelBookDto } from './dto/hotel-book.dto.js';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly amadeusService: AmadeusService) {}

  @Post('search')
  async searchHotels(@Body() dto: HotelSearchDto) {
    return this.amadeusService.searchHotels(
      dto.cityCode,
      dto.checkInDate,
      dto.checkOutDate,
      dto.adults ?? 1,
    );
  }

  @Post('book')
  async bookHotel(@Body() dto: HotelBookDto) {
    return this.amadeusService.bookHotel(dto.offerId, dto.guests, dto.payments);
  }
}
