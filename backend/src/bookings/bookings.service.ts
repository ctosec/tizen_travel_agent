import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity.js';

interface CreateBookingData {
  bookingType: string;
  status?: string;
  pnr?: string | null;
  confirmationNumber?: string | null;
  amadeusOrderId?: string | null;
  bookingData: Record<string, unknown>;
  paymentAmount?: number;
  paymentKey?: string;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async createBooking(data: CreateBookingData): Promise<Booking> {
    const booking = this.bookingRepository.create({
      bookingType: data.bookingType,
      status: data.status || 'confirmed',
      pnr: data.pnr ?? undefined,
      confirmationNumber: data.confirmationNumber ?? undefined,
      amadeusOrderId: data.amadeusOrderId ?? undefined,
      bookingData: data.bookingData,
      paymentAmount: data.paymentAmount,
      paymentKey: data.paymentKey,
    });
    return this.bookingRepository.save(booking);
  }

  async findAll(): Promise<Booking[]> {
    return this.bookingRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Booking | null> {
    return this.bookingRepository.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<Booking[]> {
    if (ids.length === 0) return [];
    return this.bookingRepository.find({
      where: { id: In(ids) },
      order: { createdAt: 'DESC' },
    });
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    booking.status = status;
    return this.bookingRepository.save(booking);
  }
}
