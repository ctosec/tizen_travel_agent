import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TravelerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
}

interface TravelerState extends TravelerData {
  setTravelerData: (data: Partial<TravelerData>) => void;
  clearTravelerData: () => void;
}

const defaults: TravelerData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  countryCode: '82',
  dateOfBirth: '',
  gender: 'MALE',
  passportNumber: '',
  passportExpiry: '',
  nationality: 'KR',
};

export const useTravelerStore = create<TravelerState>()(
  persist(
    (set) => ({
      ...defaults,
      setTravelerData: (data) => set((state) => ({ ...state, ...data })),
      clearTravelerData: () => set(defaults),
    }),
    { name: 'traveler-data' },
  ),
);
