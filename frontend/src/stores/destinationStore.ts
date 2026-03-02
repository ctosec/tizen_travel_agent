import { create } from 'zustand';
import { api } from '../api/client';
import type { DestinationData } from '../types/destination';

interface DestinationState {
  data: DestinationData | null;
  loading: boolean;
  error: string | null;
  fetchDestination: (country: string, city: string) => Promise<void>;
}

export const useDestinationStore = create<DestinationState>((set) => ({
  data: null,
  loading: false,
  error: null,
  fetchDestination: async (country, city) => {
    set({ loading: true, error: null });
    try {
      const res = await api.getDestination(country, city);
      set({ data: res.data, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load destination', loading: false });
    }
  },
}));
