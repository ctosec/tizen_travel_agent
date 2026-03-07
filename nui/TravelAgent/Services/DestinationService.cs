using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TravelAgent.Models;

namespace TravelAgent.Services
{
    public static class DestinationService
    {
        private static readonly Dictionary<string, (DateTime ExpiresAt, DestinationData Data)> _cache = new();
        private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(10);

        /// <summary>
        /// Gets destination data by combining Places API search results with
        /// Gemini-generated Korean descriptions for each attraction.
        /// Results are cached for 10 minutes.
        /// </summary>
        public static async Task<DestinationData> GetDestination(string country, string city)
        {
            var cacheKey = $"{country}:{city}";

            // Check cache
            if (_cache.TryGetValue(cacheKey, out var cached) && cached.ExpiresAt > DateTime.UtcNow)
            {
                return cached.Data;
            }

            try
            {
                // Step 1: Search for top attractions via Places API
                var query = $"{city} {country} top tourist attractions";
                var places = await PlacesService.TextSearch(query, 5);

                // Step 2: Build the list of place names for the Gemini prompt
                var placeNames = places
                    .Where(p => p.DisplayName != null)
                    .Select(p => p.DisplayName.Text)
                    .ToList();

                // Step 3: Ask Gemini for Korean descriptions
                var descriptions = new List<GeminiDescription>();
                if (placeNames.Count > 0)
                {
                    var nameList = string.Join(", ", placeNames);
                    var prompt =
                        $"다음 {city}의 관광 명소에 대해 각각 한국어로 2~3문장의 설명을 작성해주세요.\n" +
                        $"명소 목록: {nameList}\n\n" +
                        "응답은 반드시 JSON 배열 형식으로, 각 항목은 {\"name\": \"명소 이름\", \"description\": \"설명\"} 형태로 작성해주세요.\n" +
                        "JSON만 반환하고, 다른 텍스트는 포함하지 마세요.";

                    descriptions = await GeminiService.GenerateJson<List<GeminiDescription>>(prompt);
                }

                // Step 4: Combine Places data with Gemini descriptions
                var attractions = new List<Attraction>();
                foreach (var place in places)
                {
                    var name = place.DisplayName?.Text ?? "";
                    var desc = descriptions?.FirstOrDefault(d =>
                        d.Name.Equals(name, StringComparison.OrdinalIgnoreCase))?.Description ?? "";

                    var photoUrl = "";
                    if (place.Photos != null && place.Photos.Count > 0)
                    {
                        photoUrl = PlacesService.GetPhotoUrl(place.Photos[0].Name);
                    }

                    attractions.Add(new Attraction
                    {
                        Name = name,
                        Description = desc,
                        PhotoUrl = photoUrl,
                        Rating = place.Rating,
                        Address = place.FormattedAddress ?? ""
                    });
                }

                var result = new DestinationData
                {
                    Country = country,
                    City = city,
                    Attractions = attractions
                };

                // Store in cache
                _cache[cacheKey] = (DateTime.UtcNow.Add(CacheTtl), result);

                return result;
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[DestinationService] GetDestination error: {ex.Message}");
                return new DestinationData
                {
                    Country = country,
                    City = city,
                    Attractions = new List<Attraction>()
                };
            }
        }
    }
}
