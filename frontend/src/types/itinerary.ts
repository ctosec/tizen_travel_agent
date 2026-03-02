export interface Activity {
  time: string;
  activity: string;
  location: string;
  photoUrl: string | null;
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: Activity[];
}
