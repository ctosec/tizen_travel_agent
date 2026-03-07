using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace TravelAgent.Models
{
    public class Activity
    {
        [JsonPropertyName("time")]
        public string Time { get; set; } = "";
        [JsonPropertyName("activity")]
        public string ActivityName { get; set; } = "";
        [JsonPropertyName("location")]
        public string Location { get; set; } = "";
        public string PhotoUrl { get; set; } = "";
    }

    public class ItineraryDay
    {
        [JsonPropertyName("day")]
        public int Day { get; set; }
        [JsonPropertyName("date")]
        public string Date { get; set; } = "";
        [JsonPropertyName("activities")]
        public List<Activity> Activities { get; set; } = new();
    }

    public class ItineraryInput
    {
        public string Country { get; set; } = "";
        public string City { get; set; } = "";
        public int Duration { get; set; } = 5;
        public string StartDate { get; set; } = "";
    }
}
