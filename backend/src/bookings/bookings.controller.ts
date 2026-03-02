import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service.js';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  async listBookings(@Query('ids') ids?: string) {
    if (ids) {
      const idList = ids.split(',').filter(Boolean);
      const bookings = await this.bookingsService.findByIds(idList);
      return { success: true, data: bookings };
    }
    const bookings = await this.bookingsService.findAll();
    return { success: true, data: bookings };
  }

  @Get(':id')
  async getBooking(@Param('id') id: string) {
    const booking = await this.bookingsService.findById(id);
    return { success: true, data: booking };
  }

  @Delete(':id')
  async cancelBooking(@Param('id') id: string) {
    const booking = await this.bookingsService.updateBookingStatus(id, 'cancelled');
    return { success: true, data: booking };
  }
}
