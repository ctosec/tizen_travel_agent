using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TravelAgent.Models;

namespace TravelAgent.Services
{
    public static class ItineraryService
    {
        private static readonly Dictionary<string, (DateTime ExpiresAt, List<ItineraryDay> Data)> _cache = new();
        private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(10);

        /// <summary>
        /// Generates a multi-day travel itinerary using Gemini, enriched with
        /// Places API photos. Falls back to hardcoded data on failure.
        /// Results are cached for 10 minutes.
        /// </summary>
        public static async Task<List<ItineraryDay>> GenerateItinerary(ItineraryInput input)
        {
            var cacheKey = $"{input.Country}:{input.City}:{input.Duration}:{input.StartDate}";

            // Check cache
            if (_cache.TryGetValue(cacheKey, out var cached) && cached.ExpiresAt > DateTime.UtcNow)
            {
                return cached.Data;
            }

            try
            {
                // Step 1: Generate itinerary via Gemini
                var prompt =
                    $"{input.City}, {input.Country}에서 {input.Duration}일간의 여행 일정을 만들어주세요.\n" +
                    $"시작 날짜: {input.StartDate}\n\n" +
                    "응답은 반드시 JSON 배열 형식으로 작성해주세요. 각 항목은 다음과 같은 형태입니다:\n" +
                    "[\n" +
                    "  {\n" +
                    "    \"day\": 1,\n" +
                    "    \"date\": \"2025-06-01\",\n" +
                    "    \"activities\": [\n" +
                    "      {\"time\": \"09:00\", \"activity\": \"활동 설명\", \"location\": \"장소 이름\"}\n" +
                    "    ]\n" +
                    "  }\n" +
                    "]\n\n" +
                    "모든 활동 설명과 장소 이름은 한국어로 작성해주세요.\n" +
                    "각 날에 정확히 3개의 활동을 포함해주세요. 4개 이상은 안 됩니다.\n" +
                    "JSON만 반환하고, 다른 텍스트는 포함하지 마세요.";

                var itinerary = await GeminiService.GenerateJson<List<ItineraryDay>>(prompt);

                if (itinerary == null || itinerary.Count == 0)
                {
                    itinerary = GetFallbackItinerary(input);
                }

                // Step 2: Enrich activities with Places API photos
                await EnrichWithPhotos(itinerary, input.City);

                // Store in cache
                _cache[cacheKey] = (DateTime.UtcNow.Add(CacheTtl), itinerary);

                return itinerary;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[ItineraryService] GenerateItinerary error: {ex.Message}");
                var fallback = GetFallbackItinerary(input);
                return fallback;
            }
        }

        /// <summary>
        /// Searches Places API for each unique location and attaches photo URLs.
        /// </summary>
        private static async Task EnrichWithPhotos(List<ItineraryDay> itinerary, string city)
        {
            // Collect all unique locations
            var locations = itinerary
                .SelectMany(d => d.Activities)
                .Select(a => a.Location)
                .Where(l => !string.IsNullOrWhiteSpace(l))
                .Distinct()
                .ToList();

            // Build a photo lookup: location -> photoUrl
            var photoLookup = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (var location in locations)
            {
                try
                {
                    var places = await PlacesService.TextSearch($"{location} {city}", 1);
                    if (places.Count > 0 && places[0].Photos != null && places[0].Photos.Count > 0)
                    {
                        photoLookup[location] = PlacesService.GetPhotoUrl(places[0].Photos[0].Name);
                    }
                }
                catch
                {
                    // Skip on error
                }
            }

            // Apply photos to activities
            foreach (var day in itinerary)
            {
                foreach (var activity in day.Activities)
                {
                    if (!string.IsNullOrWhiteSpace(activity.Location) &&
                        photoLookup.TryGetValue(activity.Location, out var url))
                    {
                        activity.PhotoUrl = url;
                    }
                }
            }
        }

        /// <summary>
        /// Returns hardcoded fallback itinerary data for well-known cities.
        /// </summary>
        private static List<ItineraryDay> GetFallbackItinerary(ItineraryInput input)
        {
            var city = input.City?.ToLower() ?? "";
            var startDate = DateTime.TryParse(input.StartDate, out var sd) ? sd : DateTime.Today;

            var templates = GetCityTemplates(city);
            var result = new List<ItineraryDay>();

            for (int d = 0; d < input.Duration && d < templates.Count; d++)
            {
                result.Add(new ItineraryDay
                {
                    Day = d + 1,
                    Date = startDate.AddDays(d).ToString("yyyy-MM-dd"),
                    Activities = templates[d]
                });
            }

            // If duration exceeds templates, repeat the last day pattern
            for (int d = templates.Count; d < input.Duration; d++)
            {
                result.Add(new ItineraryDay
                {
                    Day = d + 1,
                    Date = startDate.AddDays(d).ToString("yyyy-MM-dd"),
                    Activities = new List<Activity>
                    {
                        new Activity { Time = "10:00", ActivityName = "자유 관광", Location = input.City },
                        new Activity { Time = "13:00", ActivityName = "현지 맛집 탐방", Location = input.City },
                        new Activity { Time = "16:00", ActivityName = "쇼핑 및 기념품 구매", Location = input.City }
                    }
                });
            }

            return result;
        }

        private static List<List<Activity>> GetCityTemplates(string city)
        {
            return city switch
            {
                "barcelona" => new List<List<Activity>>
                {
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "사그라다 파밀리아 방문", Location = "사그라다 파밀리아" },
                        new Activity { Time = "13:00", ActivityName = "보케리아 시장에서 점심", Location = "라 보케리아 시장" },
                        new Activity { Time = "16:00", ActivityName = "구엘 공원 산책", Location = "구엘 공원" },
                    },
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "카사 바트요 투어", Location = "카사 바트요" },
                        new Activity { Time = "13:00", ActivityName = "그라시아 거리 점심", Location = "그라시아 거리" },
                        new Activity { Time = "16:00", ActivityName = "바르셀로네타 해변", Location = "바르셀로네타 해변" },
                    },
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "몬주익 언덕 방문", Location = "몬주익" },
                        new Activity { Time = "13:00", ActivityName = "스페인 광장 주변 점심", Location = "스페인 광장" },
                        new Activity { Time = "16:00", ActivityName = "캄프 누 경기장 투어", Location = "캄프 누" },
                    }
                },
                "rome" => new List<List<Activity>>
                {
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "콜로세움 관람", Location = "콜로세움" },
                        new Activity { Time = "13:00", ActivityName = "로마 포럼 방문", Location = "포로 로마노" },
                        new Activity { Time = "16:00", ActivityName = "트레비 분수 방문", Location = "트레비 분수" },
                    },
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "바티칸 박물관 투어", Location = "바티칸 박물관" },
                        new Activity { Time = "13:00", ActivityName = "성 베드로 대성당", Location = "성 베드로 대성당" },
                        new Activity { Time = "16:00", ActivityName = "나보나 광장 산책", Location = "나보나 광장" },
                    },
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "보르게세 미술관", Location = "보르게세 미술관" },
                        new Activity { Time = "13:00", ActivityName = "스페인 광장 점심", Location = "스페인 광장" },
                        new Activity { Time = "16:00", ActivityName = "캄피돌리오 언덕", Location = "캄피돌리오" },
                    }
                },
                "paris" => new List<List<Activity>>
                {
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "에펠탑 방문", Location = "에펠탑" },
                        new Activity { Time = "13:00", ActivityName = "샹젤리제 거리 점심", Location = "샹젤리제 거리" },
                        new Activity { Time = "16:00", ActivityName = "개선문 전망대", Location = "개선문" },
                    },
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "루브르 박물관 투어", Location = "루브르 박물관" },
                        new Activity { Time = "13:00", ActivityName = "튈르리 정원 산책", Location = "튈르리 정원" },
                        new Activity { Time = "16:00", ActivityName = "오르세 미술관", Location = "오르세 미술관" },
                    },
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "몽마르트르 언덕", Location = "몽마르트르" },
                        new Activity { Time = "13:00", ActivityName = "사크레쾨르 대성당", Location = "사크레쾨르 대성당" },
                        new Activity { Time = "16:00", ActivityName = "노트르담 대성당", Location = "노트르담 대성당" },
                    }
                },
                "london" => new List<List<Activity>>
                {
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "버킹엄 궁전 근위병 교대식", Location = "버킹엄 궁전" },
                        new Activity { Time = "13:00", ActivityName = "웨스트민스터 사원", Location = "웨스트민스터 사원" },
                        new Activity { Time = "16:00", ActivityName = "빅벤 & 국회의사당", Location = "빅벤" },
                    },
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "대영 박물관 투어", Location = "대영 박물관" },
                        new Activity { Time = "13:00", ActivityName = "코벤트 가든 점심", Location = "코벤트 가든" },
                        new Activity { Time = "16:00", ActivityName = "타워 브릿지 방문", Location = "타워 브릿지" },
                    },
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "런던 탑 관람", Location = "런던 탑" },
                        new Activity { Time = "13:00", ActivityName = "버로 마켓 점심", Location = "버로 마켓" },
                        new Activity { Time = "16:00", ActivityName = "내셔널 갤러리", Location = "내셔널 갤러리" },
                    }
                },
                "tokyo" => new List<List<Activity>>
                {
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "센소지 절 방문", Location = "센소지" },
                        new Activity { Time = "13:00", ActivityName = "아사쿠사 나카미세 거리 점심", Location = "아사쿠사" },
                        new Activity { Time = "16:00", ActivityName = "도쿄 스카이트리 전망대", Location = "도쿄 스카이트리" },
                    },
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "츠키지 외시장 아침", Location = "츠키지 시장" },
                        new Activity { Time = "13:00", ActivityName = "메이지 신궁 방문", Location = "메이지 신궁" },
                        new Activity { Time = "16:00", ActivityName = "하라주쿠 다케시타 거리", Location = "하라주쿠" },
                    },
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "황거 외원 산책", Location = "황거" },
                        new Activity { Time = "13:00", ActivityName = "긴자 거리 점심", Location = "긴자" },
                        new Activity { Time = "16:00", ActivityName = "아키하바라 전자상가", Location = "아키하바라" },
                    }
                },
                _ => new List<List<Activity>>
                {
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "시내 주요 명소 방문", Location = city },
                        new Activity { Time = "13:00", ActivityName = "현지 레스토랑 점심", Location = city },
                        new Activity { Time = "16:00", ActivityName = "박물관 또는 미술관 방문", Location = city },
                    },
                    new List<Activity>
                    {
                        new Activity { Time = "09:00", ActivityName = "역사 지구 투어", Location = city },
                        new Activity { Time = "13:00", ActivityName = "시장 탐방 및 점심", Location = city },
                        new Activity { Time = "16:00", ActivityName = "공원 또는 정원 산책", Location = city },
                    },
                    new List<Activity>
                    {
                        new Activity { Time = "10:00", ActivityName = "자유 관광", Location = city },
                        new Activity { Time = "13:00", ActivityName = "현지 맛집 탐방", Location = city },
                        new Activity { Time = "16:00", ActivityName = "쇼핑 및 기념품 구매", Location = city }
                    }
                }
            };
        }
    }
}
