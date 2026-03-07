using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace TravelAgent.Models
{
    public class Attraction
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";
        [JsonPropertyName("description")]
        public string Description { get; set; } = "";
        [JsonPropertyName("photoUrl")]
        public string PhotoUrl { get; set; } = "";
        [JsonPropertyName("rating")]
        public double? Rating { get; set; }
        [JsonPropertyName("address")]
        public string Address { get; set; } = "";
    }

    public class DestinationData
    {
        public string Country { get; set; } = "";
        public string City { get; set; } = "";
        public List<Attraction> Attractions { get; set; } = new();
    }

    public class PlaceResult
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = "";
        [JsonPropertyName("displayName")]
        public PlaceDisplayName DisplayName { get; set; }
        [JsonPropertyName("formattedAddress")]
        public string FormattedAddress { get; set; } = "";
        [JsonPropertyName("rating")]
        public double? Rating { get; set; }
        [JsonPropertyName("photos")]
        public List<PlacePhoto> Photos { get; set; }
    }

    public class PlaceDisplayName
    {
        [JsonPropertyName("text")]
        public string Text { get; set; } = "";
    }

    public class PlacePhoto
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";
    }

    public class PlaceSearchResponse
    {
        [JsonPropertyName("places")]
        public List<PlaceResult> Places { get; set; }
    }

    public class GeminiDescription
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";
        [JsonPropertyName("description")]
        public string Description { get; set; } = "";
    }
}
