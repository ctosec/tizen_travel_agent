using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using TravelAgent.Models;

namespace TravelAgent.Services
{
    public static class PlacesService
    {
        private static readonly HttpClient _client = new HttpClient();

        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        /// <summary>
        /// Performs a text search using the Google Places API (New).
        /// </summary>
        public static async Task<List<PlaceResult>> TextSearch(string query, int maxResults = 5)
        {
            try
            {
                var url = "https://places.googleapis.com/v1/places:searchText";

                var requestBody = new
                {
                    textQuery = query,
                    languageCode = "ko",
                    maxResultCount = maxResults
                };

                var json = JsonSerializer.Serialize(requestBody);
                var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                };

                request.Headers.Add("X-Goog-Api-Key", ApiConfig.GooglePlacesApiKey);
                request.Headers.Add("X-Goog-FieldMask",
                    "places.id,places.displayName,places.formattedAddress,places.rating,places.photos");

                var response = await _client.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var responseJson = await response.Content.ReadAsStringAsync();
                var searchResponse = JsonSerializer.Deserialize<PlaceSearchResponse>(responseJson, _jsonOptions);

                return searchResponse?.Places ?? new List<PlaceResult>();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[PlacesService] TextSearch error: {ex.Message}");
                return new List<PlaceResult>();
            }
        }

        /// <summary>
        /// Builds the photo URL for a given Places photo resource name.
        /// </summary>
        public static string GetPhotoUrl(string photoName, int maxWidth = 800)
        {
            if (string.IsNullOrEmpty(photoName))
                return "";

            return $"https://places.googleapis.com/v1/{photoName}/media?maxWidthPx={maxWidth}&key={ApiConfig.GooglePlacesApiKey}";
        }
    }
}
