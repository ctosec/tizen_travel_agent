import type { HotelOffer } from '../types/booking';

interface HotelSearchParams {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
}

const HOTEL_TEMPLATES: Record<string, { name: string; chain?: string }[]> = {
  BCN: [
    { name: 'Hotel Arts Barcelona', chain: 'RC' },
    { name: 'W Barcelona', chain: 'WH' },
    { name: 'Mandarin Oriental Barcelona', chain: 'MO' },
    { name: 'Majestic Hotel & Spa', chain: 'LX' },
    { name: 'Hotel Casa Fuster' },
  ],
  FCO: [
    { name: 'Hotel Hassler Roma', chain: 'LX' },
    { name: 'Hotel de Russie', chain: 'RC' },
    { name: 'The St. Regis Rome', chain: 'SR' },
    { name: 'Hotel Eden Roma', chain: 'DC' },
    { name: 'Rome Cavalieri' },
  ],
  CDG: [
    { name: 'The Ritz Paris', chain: 'LX' },
    { name: 'Hotel Plaza Athenee', chain: 'DC' },
    { name: 'Le Bristol Paris', chain: 'LX' },
    { name: 'Four Seasons Hotel George V', chain: 'FS' },
    { name: 'Hotel Le Marais' },
  ],
  LHR: [
    { name: 'The Savoy', chain: 'FC' },
    { name: 'Claridge\'s London', chain: 'LX' },
    { name: 'The Dorchester', chain: 'DC' },
    { name: 'Shangri-La The Shard', chain: 'SL' },
    { name: 'The Langham London' },
  ],
  NRT: [
    { name: 'Park Hyatt Tokyo', chain: 'HY' },
    { name: 'Aman Tokyo', chain: 'AM' },
    { name: 'The Peninsula Tokyo', chain: 'PL' },
    { name: 'Mandarin Oriental Tokyo', chain: 'MO' },
    { name: 'Hotel Gracery Shinjuku' },
  ],
  default: [
    { name: 'Grand Hotel Central' },
    { name: 'Boutique Hotel Luxe' },
    { name: 'Park Royal Suites' },
    { name: 'Metropolitan Inn' },
    { name: 'City View Hotel' },
  ],
};

const ROOM_CATEGORIES = [
  'STANDARD_ROOM',
  'SUPERIOR_ROOM',
  'DELUXE_ROOM',
  'EXECUTIVE_SUITE',
  'JUNIOR_SUITE',
];

const BED_TYPES = ['DOUBLE', 'TWIN', 'KING', 'QUEEN'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function searchMockHotels(params: HotelSearchParams): HotelOffer[] {
  const { cityCode, checkInDate, checkOutDate } = params;
  const templates = HOTEL_TEMPLATES[cityCode] || HOTEL_TEMPLATES['default'];
  const hotels: HotelOffer[] = [];

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    const basePrice = randomInt(150, 800);
    const category = ROOM_CATEGORIES[i % ROOM_CATEGORIES.length];
    const bedType = BED_TYPES[i % BED_TYPES.length];

    hotels.push({
      type: 'hotel-offers',
      hotel: {
        type: 'hotel',
        hotelId: `MOCK${cityCode}${i}`,
        chainCode: template.chain,
        name: template.name,
        cityCode,
      },
      available: true,
      offers: [{
        id: `offer-${i + 1}`,
        checkInDate,
        checkOutDate,
        room: {
          type: category,
          typeEstimated: {
            category,
            beds: bedType === 'TWIN' ? 2 : 1,
            bedType,
          },
          description: {
            text: `${category.replace(/_/g, ' ')} with ${bedType.toLowerCase()} bed, city view`,
          },
        },
        price: {
          currency: 'EUR',
          total: String(basePrice) + '.00',
          base: String(Math.round(basePrice * 0.85)) + '.00',
        },
      }],
    });
  }

  // Sort by price
  hotels.sort((a, b) =>
    Number(a.offers[0]?.price.total || 0) - Number(b.offers[0]?.price.total || 0),
  );
  return hotels;
}
