import type { FlightOffer } from '../types/booking';

interface FlightSearchParams {
  originCode: string;
  destinationCode: string;
  dateOfDeparture: string;
  adults?: number;
}

const AIRLINES: { code: string; name: string }[] = [
  { code: 'KE', name: 'Korean Air' },
  { code: 'OZ', name: 'Asiana Airlines' },
  { code: 'LH', name: 'Lufthansa' },
  { code: 'AF', name: 'Air France' },
  { code: 'BA', name: 'British Airways' },
  { code: 'TK', name: 'Turkish Airlines' },
  { code: 'EK', name: 'Emirates' },
  { code: 'SQ', name: 'Singapore Airlines' },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDuration(hours: number, minutes: number): string {
  return `PT${hours}H${minutes}M`;
}

function addHours(dateStr: string, hours: number, minutes: number): string {
  const d = new Date(dateStr);
  d.setHours(d.getHours() + hours, d.getMinutes() + minutes);
  return d.toISOString();
}

export function searchMockFlights(params: FlightSearchParams): FlightOffer[] {
  const { originCode, destinationCode, dateOfDeparture } = params;
  const baseDate = `${dateOfDeparture}T`;
  const flights: FlightOffer[] = [];

  // Generate 5 mock flights
  for (let i = 0; i < 5; i++) {
    const airline = AIRLINES[i % AIRLINES.length];
    const stops = i < 2 ? 0 : i < 4 ? 1 : 2;
    const flightHours = randomInt(10, 14);
    const flightMinutes = randomInt(0, 59);
    const departHour = randomInt(6, 20);
    const departMinute = randomInt(0, 59);
    const departureAt = `${baseDate}${String(departHour).padStart(2, '0')}:${String(departMinute).padStart(2, '0')}:00`;
    const arrivalAt = addHours(departureAt, flightHours, flightMinutes);
    const basePrice = randomInt(600, 2200);
    const grandTotal = (basePrice + randomInt(50, 200)).toFixed(2);

    const segments = [];
    if (stops === 0) {
      segments.push({
        departure: { iataCode: originCode, terminal: '2', at: departureAt },
        arrival: { iataCode: destinationCode, terminal: '1', at: arrivalAt },
        carrierCode: airline.code,
        number: String(randomInt(100, 999)),
        aircraft: { code: '789' },
        duration: formatDuration(flightHours, flightMinutes),
        id: '1',
        numberOfStops: 0,
      });
    } else {
      const transitCodes = ['FRA', 'IST', 'DXB', 'SIN', 'NRT'];
      const transit = transitCodes[i % transitCodes.length];
      const leg1Hours = randomInt(4, 7);
      const leg1Mins = randomInt(0, 59);
      const transitArrival = addHours(departureAt, leg1Hours, leg1Mins);
      const transitDepart = addHours(transitArrival, 1, randomInt(30, 59));

      segments.push({
        departure: { iataCode: originCode, terminal: '2', at: departureAt },
        arrival: { iataCode: transit, terminal: '1', at: transitArrival },
        carrierCode: airline.code,
        number: String(randomInt(100, 999)),
        aircraft: { code: '789' },
        duration: formatDuration(leg1Hours, leg1Mins),
        id: '1',
        numberOfStops: 0,
      });
      segments.push({
        departure: { iataCode: transit, terminal: '1', at: transitDepart },
        arrival: { iataCode: destinationCode, terminal: '1', at: arrivalAt },
        carrierCode: airline.code,
        number: String(randomInt(100, 999)),
        aircraft: { code: '321' },
        duration: formatDuration(flightHours - leg1Hours, 0),
        id: '2',
        numberOfStops: 0,
      });
    }

    flights.push({
      type: 'flight-offer',
      id: String(i + 1),
      source: 'MOCK',
      instantTicketingRequired: false,
      nonHomogeneous: false,
      oneWay: true,
      lastTicketingDate: dateOfDeparture,
      numberOfBookableSeats: randomInt(1, 9),
      itineraries: [{
        duration: formatDuration(flightHours, flightMinutes),
        segments,
      }],
      price: {
        currency: 'EUR',
        total: grandTotal,
        base: String(basePrice) + '.00',
        grandTotal,
      },
      travelerPricings: [{
        travelerId: '1',
        fareOption: 'STANDARD',
        travelerType: 'ADULT',
        price: { currency: 'EUR', total: grandTotal, base: String(basePrice) + '.00' },
      }],
    });
  }

  // Sort by price
  flights.sort((a, b) => Number(a.price.grandTotal) - Number(b.price.grandTotal));
  return flights;
}
