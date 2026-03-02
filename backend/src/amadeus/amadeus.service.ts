import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Amadeus = require('amadeus');

@Injectable()
export class AmadeusService implements OnModuleInit {
  private readonly logger = new Logger(AmadeusService.name);
  private amadeus: InstanceType<typeof Amadeus>;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.amadeus = new Amadeus({
      clientId: this.configService.get<string>('AMADEUS_CLIENT_ID'),
      clientSecret: this.configService.get<string>('AMADEUS_CLIENT_SECRET'),
      hostname: this.configService.get<string>('AMADEUS_HOSTNAME', 'test'),
    });
    this.logger.log('Amadeus SDK initialized');
  }

  async searchFlights(
    originCode: string,
    destinationCode: string,
    dateOfDeparture: string,
    adults: number = 1,
    travelClass: string = 'ECONOMY',
  ) {
    try {
      const response = await this.amadeus.shopping.flightOffersSearch.get({
        originLocationCode: originCode,
        destinationLocationCode: destinationCode,
        departureDate: dateOfDeparture,
        adults,
        travelClass,
        currencyCode: 'KRW',
        max: 10,
      });

      return {
        success: true,
        data: response.data,
        dictionaries: response.result?.dictionaries,
      };
    } catch (error: unknown) {
      this.logger.error('Flight search error:', error);
      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: Number((errorObj?.response as Record<string, unknown>)?.statusCode) || 500,
        message:
          (errorObj?.description as { detail?: string })?.detail ||
          'Failed to search flights',
      };
    }
  }

  async searchHotels(
    cityCode: string,
    checkInDate: string,
    checkOutDate: string,
    adults: number = 1,
  ) {
    try {
      const hotelListResponse =
        await this.amadeus.referenceData.locations.hotels.byCity.get({
          cityCode,
        });

      if (!hotelListResponse.data || hotelListResponse.data.length === 0) {
        return { success: true, data: [], message: 'No hotels found in this city' };
      }

      const hotelIds = hotelListResponse.data
        .slice(0, 20)
        .map((hotel: { hotelId: string }) => hotel.hotelId);

      const offersResponse =
        await this.amadeus.shopping.hotelOffersSearch.get({
          hotelIds: hotelIds.join(','),
          checkInDate,
          checkOutDate,
          adults,
          currency: 'KRW',
          bestRateOnly: true,
        });

      return { success: true, data: offersResponse.data };
    } catch (error: unknown) {
      this.logger.error('Hotel search error:', error);
      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: Number((errorObj?.response as Record<string, unknown>)?.statusCode) || 500,
        message:
          (errorObj?.description as { detail?: string })?.detail ||
          'Failed to search hotels',
      };
    }
  }

  async bookFlight(
    flightOffer: Record<string, unknown>,
    travelers: Record<string, unknown>[],
  ): Promise<{ success: boolean; data?: unknown; error?: number | string; message?: string }> {
    try {
      const pricingResponse =
        await this.amadeus.shopping.flightOffers.pricing.post(
          JSON.stringify({
            data: { type: 'flight-offers-pricing', flightOffers: [flightOffer] },
          }),
        );

      const pricedOffer = pricingResponse.data.flightOffers[0];

      const orderResponse = await this.amadeus.booking.flightOrders.post(
        JSON.stringify({
          data: {
            type: 'flight-order',
            flightOffers: [pricedOffer],
            travelers,
            remarks: {
              general: [{ subType: 'GENERAL_MISCELLANEOUS', text: 'TIZEN TRAVEL AGENT BOOKING' }],
            },
            ticketingAgreement: {
              option: 'DELAY_TO_QUEUE',
              dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
            contacts: [
              {
                addresseeName: {
                  firstName: (travelers[0] as Record<string, Record<string, string>>)?.name?.firstName || 'TRAVELER',
                  lastName: (travelers[0] as Record<string, Record<string, string>>)?.name?.lastName || 'ONE',
                },
                companyName: 'TIZEN TRAVEL',
                purpose: 'STANDARD',
                phones: [{ deviceType: 'MOBILE', countryCallingCode: '82', number: '01012345678' }],
                emailAddress: 'booking@tizentravel.com',
              },
            ],
          },
        }),
      );

      return { success: true, data: orderResponse.data };
    } catch (error: unknown) {
      this.logger.error('Flight booking error:', error);
      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: Number((errorObj?.response as Record<string, unknown>)?.statusCode) || 500,
        message: (errorObj?.description as { detail?: string })?.detail || 'Failed to book flight',
      };
    }
  }

  async bookHotel(
    offerId: string,
    guests: Record<string, unknown>[],
    payments: Record<string, unknown>[],
  ): Promise<{ success: boolean; data?: unknown; error?: number | string; message?: string }> {
    try {
      const response = await this.amadeus.booking.hotelOrders.post(
        JSON.stringify({
          data: {
            type: 'hotel-order',
            guests,
            travelAgent: { contact: { email: 'booking@tizentravel.com' } },
            roomAssociations: [
              {
                guestReferences: guests.map((_: Record<string, unknown>, index: number) => ({
                  guestReference: String(index + 1),
                })),
                hotelOfferId: offerId,
              },
            ],
            payment: {
              brand: (payments[0] as Record<string, string>)?.brand || 'VISA',
              binNumber: (payments[0] as Record<string, string>)?.binNumber || '411111',
              flightOfferPrice: (payments[0] as Record<string, string>)?.flightOfferPrice || '0',
            },
          },
        }),
      );

      return { success: true, data: response.data };
    } catch (error: unknown) {
      this.logger.error('Hotel booking error:', error);
      const errorObj = error as Record<string, unknown>;
      return {
        success: false,
        error: Number((errorObj?.response as Record<string, unknown>)?.statusCode) || 500,
        message: (errorObj?.description as { detail?: string })?.detail || 'Failed to book hotel',
      };
    }
  }
}
