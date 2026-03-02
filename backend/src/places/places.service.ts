import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
  photoRef: string | null;
  rating: number | null;
  types: string[];
}

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY', '');
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_PLACES_API_KEY not set — Places features will be unavailable');
    }
  }

  async textSearch(query: string, maxResults: number = 5): Promise<PlaceResult[]> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.rating,places.types',
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: maxResults,
        languageCode: 'ko',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(`Places API error: ${response.status} ${errText}`);
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      places?: Array<{
        id: string;
        displayName: { text: string };
        formattedAddress: string;
        location: { latitude: number; longitude: number };
        photos?: Array<{ name: string }>;
        rating?: number;
        types?: string[];
      }>;
    };

    return (data.places || []).map((place) => ({
      placeId: place.id,
      name: place.displayName?.text || '',
      formattedAddress: place.formattedAddress || '',
      location: {
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
      },
      photoRef: place.photos?.[0]?.name || null,
      rating: place.rating || null,
      types: place.types || [],
    }));
  }

  getPhotoUrl(photoRef: string, maxWidth: number = 800): string {
    if (!this.apiKey) return '';
    return `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=${maxWidth}&key=${this.apiKey}`;
  }
}
