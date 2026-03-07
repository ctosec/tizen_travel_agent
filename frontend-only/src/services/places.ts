export interface PlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
  photoRef: string | null;
  rating: number | null;
  types: string[];
}

function getApiKey(): string {
  return import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';
}

export async function textSearch(query: string, maxResults: number = 5): Promise<PlaceResult[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('VITE_GOOGLE_PLACES_API_KEY not set');
  }

  const url = 'https://places.googleapis.com/v1/places:searchText';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
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
    console.error(`Places API error: ${response.status} ${errText}`);
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

export function getPhotoUrl(photoRef: string, maxWidth: number = 800): string {
  const apiKey = getApiKey();
  if (!apiKey) return '';
  return `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=${maxWidth}&key=${apiKey}`;
}
