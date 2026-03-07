using System.Collections.Generic;

namespace TravelAgent.Utils
{
    public static class AirportCodes
    {
        private static readonly Dictionary<string, string> CityToCode = new()
        {
            { "Barcelona", "BCN" }, { "Rome", "FCO" }, { "Paris", "CDG" },
            { "London", "LHR" }, { "Tokyo", "NRT" }, { "New York", "JFK" },
            { "Dubai", "DXB" }, { "Singapore", "SIN" }, { "Bangkok", "BKK" },
            { "Istanbul", "IST" }, { "Sydney", "SYD" }, { "Seoul", "ICN" },
            { "Osaka", "KIX" }, { "Amsterdam", "AMS" }, { "Madrid", "MAD" }
        };

        public static string GetCode(string city)
        {
            return CityToCode.GetValueOrDefault(city, "BCN");
        }
    }
}
