import { create } from 'zustand';
import { getAirportCode } from '../utils/airportCodes';

interface TravelConfigState {
  city: string;
  country: string;
  airportCode: string;
  setDestination: (city: string, country: string) => void;
}

export const useTravelConfigStore = create<TravelConfigState>((set) => ({
  city: 'Barcelona',
  country: 'Spain',
  airportCode: 'BCN',
  setDestination: (city, country) =>
    set({ city, country, airportCode: getAirportCode(city) }),
}));

/**
 * Parse launch parameters from Tizen app_control or URL query params.
 * Call once at app startup (main.tsx).
 */
export function parseLaunchParams(): void {
  let city: string | null = null;
  let country: string | null = null;

  // 1) Tizen app_control (only available in Tizen runtime)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tizen = (window as any).tizen;
    if (tizen?.application) {
      const reqAppControl = tizen.application
        .getCurrentApplication()
        .getRequestedAppControl();
      const dataList = reqAppControl?.appControl?.data;
      console.log('[TravelConfig] app_control data:', JSON.stringify(dataList));
      if (Array.isArray(dataList)) {
        for (const item of dataList) {
          if (item.key === 'city' && item.value?.[0]) city = item.value[0];
          if (item.key === 'country' && item.value?.[0]) country = item.value[0];
        }
      }
    }
  } catch (e) {
    console.log('[TravelConfig] app_control not available:', e);
  }

  // 2) Fallback: URL query parameters (?city=Rome&country=Italy)
  if (!city || !country) {
    const params = new URLSearchParams(window.location.search);
    city = city || params.get('city');
    country = country || params.get('country');
  }

  console.log(`[TravelConfig] Resolved: city=${city}, country=${country}`);

  // Apply if both values found
  if (city && country) {
    useTravelConfigStore.getState().setDestination(city, country);
    console.log(`[TravelConfig] Destination set to ${city}, ${country} (airport: ${getAirportCode(city)})`);
  } else {
    console.log('[TravelConfig] Using default: Barcelona, Spain');
  }
}
