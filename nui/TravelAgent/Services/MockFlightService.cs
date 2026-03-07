using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TravelAgent.Models;

namespace TravelAgent.Services
{
    public static class MockFlightService
    {
        private static readonly string[] Airlines = { "KE", "OZ", "LH", "AF", "BA", "TK", "EK", "SQ" };
        private static readonly Random _random = new Random();

        /// <summary>
        /// Generates 5 random mock flight offers sorted by price ascending.
        /// </summary>
        public static Task<List<FlightOffer>> Search(string origin, string destination, string date)
        {
            var flights = new List<FlightOffer>();

            for (int i = 0; i < 5; i++)
            {
                var airline = Airlines[_random.Next(Airlines.Length)];
                var flightNumber = _random.Next(100, 9999).ToString();
                var price = _random.Next(600, 2201); // 600-2200 EUR
                var stops = _random.Next(0, 3);       // 0-2 stops

                // Base flight duration: 2-14 hours depending on stops
                var baseHours = _random.Next(2, 8);
                var totalHours = baseHours + (stops * _random.Next(2, 5));
                var totalMinutes = _random.Next(0, 60);
                var duration = $"PT{totalHours}H{totalMinutes}M";

                // Calculate departure and arrival times
                var departureTime = DateTime.TryParse(date, out var depDate) ? depDate : DateTime.Today;
                var depHour = _random.Next(6, 22);
                departureTime = departureTime.AddHours(depHour);
                var arrivalTime = departureTime.AddHours(totalHours).AddMinutes(totalMinutes);

                // Build segments
                var segments = new List<FlightSegment>();
                if (stops == 0)
                {
                    segments.Add(new FlightSegment
                    {
                        Departure = new FlightEndpoint
                        {
                            IataCode = origin,
                            At = departureTime.ToString("yyyy-MM-ddTHH:mm:ss")
                        },
                        Arrival = new FlightEndpoint
                        {
                            IataCode = destination,
                            At = arrivalTime.ToString("yyyy-MM-ddTHH:mm:ss")
                        },
                        CarrierCode = airline,
                        Number = flightNumber
                    });
                }
                else
                {
                    // Generate intermediate stops
                    var stopCodes = GetTransitCodes(stops);
                    var segmentDuration = TimeSpan.FromMinutes(
                        (totalHours * 60 + totalMinutes) / (stops + 1));
                    var currentTime = departureTime;

                    for (int s = 0; s <= stops; s++)
                    {
                        var segFrom = s == 0 ? origin : stopCodes[s - 1];
                        var segTo = s == stops ? destination : stopCodes[s];
                        var segArrival = currentTime.Add(segmentDuration);

                        segments.Add(new FlightSegment
                        {
                            Departure = new FlightEndpoint
                            {
                                IataCode = segFrom,
                                At = currentTime.ToString("yyyy-MM-ddTHH:mm:ss")
                            },
                            Arrival = new FlightEndpoint
                            {
                                IataCode = segTo,
                                At = segArrival.ToString("yyyy-MM-ddTHH:mm:ss")
                            },
                            CarrierCode = airline,
                            Number = $"{flightNumber}{s}"
                        });

                        // Layover of 1-3 hours
                        currentTime = segArrival.AddHours(_random.Next(1, 4));
                    }
                }

                flights.Add(new FlightOffer
                {
                    Id = $"FL{i + 1:D3}",
                    Price = new FlightPrice
                    {
                        Total = price.ToString(),
                        Currency = "EUR"
                    },
                    Itineraries = new List<FlightItinerary>
                    {
                        new FlightItinerary
                        {
                            Duration = duration,
                            Segments = segments
                        }
                    }
                });
            }

            // Sort by price ascending
            flights = flights.OrderBy(f => int.Parse(f.Price.Total)).ToList();

            return Task.FromResult(flights);
        }

        private static string[] GetTransitCodes(int count)
        {
            var candidates = new[] { "IST", "DXB", "FRA", "CDG", "SIN", "DOH", "AMS", "LHR", "ICN", "NRT" };
            var result = new string[count];
            var used = new HashSet<int>();

            for (int i = 0; i < count; i++)
            {
                int idx;
                do { idx = _random.Next(candidates.Length); }
                while (used.Contains(idx));

                used.Add(idx);
                result[i] = candidates[idx];
            }

            return result;
        }
    }
}
