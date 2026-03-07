import { generateJSON } from './gemini';
import { textSearch, getPhotoUrl } from './places';
import type { DestinationData, Attraction } from '../types/destination';

const cache = new Map<string, { data: DestinationData; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function getDestination(country: string, city: string): Promise<DestinationData> {
  const cacheKey = `${country}:${city}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Step 1: Search for top attractions via Google Places
  const places = await textSearch(
    `top tourist attractions in ${city}, ${country}`,
    5,
  );

  // Step 2: Generate Korean descriptions via Gemini
  let descriptions: Record<string, string> = {};
  try {
    const namesList = places.map((p) => `- "${p.name}"`).join('\n');
    descriptions = await generateJSON<Record<string, string>>(
      `다음은 ${country} ${city}의 관광 명소 목록입니다:
${namesList}

각 명소에 대해 2-3문장의 한국어 설명을 작성해주세요. 설명은 해당 장소의 특징과 방문 이유를 포함해야 합니다.

JSON 형식으로 응답해주세요. 키는 위 목록의 이름을 정확히 그대로 사용하세요.
예시: {"사그라다 파밀리아": "가우디의 미완성 걸작으로..."}`,
    );
  } catch (error) {
    console.warn('Gemini description generation failed, using fallback', error);
  }

  // Step 3: Combine Places data + Gemini descriptions
  const attractions: Attraction[] = places.map((place) => ({
    name: place.name,
    description: descriptions[place.name] || `${city}의 유명한 관광 명소입니다.`,
    photoUrl: place.photoRef ? getPhotoUrl(place.photoRef, 1080) : null,
    rating: place.rating,
    address: place.formattedAddress,
  }));

  const result: DestinationData = { country, city, attractions };
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}
