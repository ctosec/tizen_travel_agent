import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service.js';
import { PlacesService } from '../places/places.service.js';

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

interface GenerateItineraryInput {
  country: string;
  city: string;
  startDate: string;  // YYYY-MM-DD
  duration: number;   // days
}

@Injectable()
export class ItineraryService {
  private readonly logger = new Logger(ItineraryService.name);
  private cache = new Map<string, { data: ItineraryDay[]; timestamp: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000;

  constructor(
    private readonly geminiService: GeminiService,
    private readonly placesService: PlacesService,
  ) {}

  async generateItinerary(input: GenerateItineraryInput): Promise<ItineraryDay[]> {
    const cacheKey = `${input.city}-${input.duration}-${input.startDate}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // Step 1: Generate itinerary with Gemini
    let itinerary: ItineraryDay[];
    try {
      const prompt = `${input.country} ${input.city} ${input.duration}일 여행 일정을 만들어주세요.

여행 시작일: ${input.startDate}

요구사항:
- 1일차: 오후 도착 (인천에서 항공편). 호텔 체크인 후 주변 탐방.
- 마지막 날: 오전 관광 후 오후에 공항으로 이동, 출국.
- 매일 3개의 활동을 포함해주세요.
- 관광 명소, 맛집, 문화 체험을 적절히 섞어주세요.
- activity는 한국어로, location은 영어(장소 이름)로 작성해주세요.

다음 JSON 형식으로 정확하게 응답해주세요:
[
  {
    "day": 1,
    "date": "YYYY-MM-DD",
    "activities": [
      { "time": "15:00", "activity": "한국어 활동 설명", "location": "Place Name in English" },
      { "time": "17:00", "activity": "한국어 활동 설명", "location": "Place Name in English" },
      { "time": "19:00", "activity": "한국어 활동 설명", "location": "Place Name in English" }
    ]
  }
]`;

      itinerary = await this.geminiService.generateJSON<ItineraryDay[]>(prompt);
    } catch (error) {
      this.logger.warn('Gemini itinerary generation failed, using fallback', error);
      itinerary = this.buildFallbackItinerary(input);
    }

    // Step 2: Enrich each activity with Google Places photos
    for (const day of itinerary) {
      for (const activity of day.activities) {
        try {
          const places = await this.placesService.textSearch(
            `${activity.location} ${input.city}`,
            1,
          );
          if (places.length > 0 && places[0].photoRef) {
            activity.photoUrl = `/api/places/photo/${places[0].photoRef}?maxWidth=400`;
          } else {
            activity.photoUrl = null;
          }
        } catch {
          activity.photoUrl = null;
        }
      }
    }

    this.cache.set(cacheKey, { data: itinerary, timestamp: Date.now() });
    return itinerary;
  }

  private buildFallbackItinerary(input: GenerateItineraryInput): ItineraryDay[] {
    const fallbackActivities: Record<string, { activity: string; location: string }[]> = {
      Barcelona: [
        { activity: '사그라다 파밀리아 성당 관람', location: 'Sagrada Familia' },
        { activity: '고딕 지구 산책 및 탐방', location: 'Gothic Quarter' },
        { activity: '라 보케리아 시장에서 타파스 즐기기', location: 'La Boqueria Market' },
        { activity: '구엘 공원 방문', location: 'Park Guell' },
        { activity: '카사 바트요 건축 감상', location: 'Casa Batllo' },
        { activity: '바르셀로네타 해변 산책', location: 'Barceloneta Beach' },
        { activity: '몬주익 언덕 전망대', location: 'Montjuic Castle' },
        { activity: '캄프 누 스타디움 투어', location: 'Camp Nou' },
        { activity: '람블라스 거리 야경 산책', location: 'La Rambla' },
        { activity: '플라멩코 공연 감상', location: 'Tablao Flamenco Cordobes' },
        { activity: '카탈루냐 음악당 방문', location: 'Palau de la Musica Catalana' },
        { activity: '엘 보른 지구 쇼핑', location: 'El Born' },
        { activity: '피카소 미술관 관람', location: 'Museu Picasso' },
        { activity: '스페인 전통 빠에야 저녁', location: '7 Portes Restaurant' },
        { activity: '시우타데야 공원 휴식', location: 'Parc de la Ciutadella' },
      ],
      default: [
        { activity: '도시 중심부 관광', location: 'City Center' },
        { activity: '현지 맛집 탐방', location: 'Local Restaurant' },
        { activity: '유명 박물관 관람', location: 'National Museum' },
        { activity: '전통 시장 방문', location: 'Traditional Market' },
        { activity: '공원 산책', location: 'Central Park' },
        { activity: '역사 지구 탐방', location: 'Historic District' },
        { activity: '전망대 방문', location: 'Observation Point' },
        { activity: '현지 카페에서 휴식', location: 'Local Cafe' },
        { activity: '쇼핑 거리 구경', location: 'Shopping Street' },
      ],
    };

    const activities = fallbackActivities[input.city] || fallbackActivities['default'];
    const times = ['10:00', '14:00', '19:00'];
    const startDate = new Date(input.startDate);

    const days: ItineraryDay[] = [];
    for (let i = 0; i < input.duration; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayActivities: Activity[] = [];

      for (let j = 0; j < 3; j++) {
        const idx = (i * 3 + j) % activities.length;
        let time = times[j];
        if (i === 0) time = ['15:00', '17:00', '19:00'][j];
        if (i === input.duration - 1 && j === 2) time = '14:00';

        dayActivities.push({
          time,
          activity: activities[idx].activity,
          location: activities[idx].location,
          photoUrl: null,
        });
      }

      days.push({
        day: i + 1,
        date: date.toISOString().split('T')[0],
        activities: dayActivities,
      });
    }

    return days;
  }
}
