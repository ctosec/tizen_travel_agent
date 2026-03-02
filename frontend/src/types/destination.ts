export interface Attraction {
  name: string;
  description: string;
  photoUrl: string | null;
  rating: number | null;
  address: string;
}

export interface DestinationData {
  country: string;
  city: string;
  attractions: Attraction[];
}
