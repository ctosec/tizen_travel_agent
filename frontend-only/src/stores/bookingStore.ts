import { create } from 'zustand';
import { api } from '../api/client';
import type { FlightOffer, HotelOffer } from '../types/booking';

interface BookingState {
  flights: FlightOffer[];
  hotels: HotelOffer[];
  selectedFlight: FlightOffer | null;
  selectedHotel: HotelOffer | null;
  flightsLoading: boolean;
  hotelsLoading: boolean;
  error: string | null;
  searchFlights: (origin: string, destination: string, date: string) => Promise<void>;
  searchHotels: (cityCode: string, checkIn: string, checkOut: string) => Promise<void>;
  selectFlight: (flight: FlightOffer | null) => void;
  selectHotel: (hotel: HotelOffer | null) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  flights: [],
  hotels: [],
  selectedFlight: null,
  selectedHotel: null,
  flightsLoading: false,
  hotelsLoading: false,
  error: null,
  searchFlights: async (origin, destination, date) => {
    set({ flightsLoading: true, error: null });
    try {
      const res = await api.searchFlights({
        originCode: origin,
        destinationCode: destination,
        dateOfDeparture: date,
      });
      set({ flights: res.data || [], flightsLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Flight search failed', flightsLoading: false });
    }
  },
  searchHotels: async (cityCode, checkIn, checkOut) => {
    set({ hotelsLoading: true, error: null });
    try {
      const res = await api.searchHotels({ cityCode, checkInDate: checkIn, checkOutDate: checkOut });
      set({ hotels: res.data || [], hotelsLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Hotel search failed', hotelsLoading: false });
    }
  },
  selectFlight: (flight) => set({ selectedFlight: flight }),
  selectHotel: (hotel) => set({ selectedHotel: hotel }),
  reset: () => set({ flights: [], hotels: [], selectedFlight: null, selectedHotel: null, error: null }),
}));
