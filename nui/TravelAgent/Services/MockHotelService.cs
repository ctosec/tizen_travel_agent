using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TravelAgent.Models;

namespace TravelAgent.Services
{
    public static class MockHotelService
    {
        private static readonly Random _random = new Random();

        private static readonly string[] RoomCategories = { "Standard", "Superior", "Deluxe", "Suite" };

        private static readonly Dictionary<string, string[]> CityHotels = new(StringComparer.OrdinalIgnoreCase)
        {
            ["BCN"] = new[]
            {
                "Hotel Arts Barcelona",
                "W Barcelona",
                "Mandarin Oriental Barcelona",
                "Majestic Hotel & Spa",
                "El Palace Barcelona",
                "Casa Camper Barcelona",
                "Hotel 1898"
            },
            ["ROM"] = new[]
            {
                "Hotel Hassler Roma",
                "Hotel de Russie",
                "The St. Regis Rome",
                "Hotel Eden",
                "Palazzo Manfredi",
                "Hotel Raphael",
                "Portrait Roma"
            },
            ["PAR"] = new[]
            {
                "The Ritz Paris",
                "Le Meurice",
                "Four Seasons Hotel George V",
                "Hotel Plaza Athenee",
                "Shangri-La Hotel Paris",
                "Le Bristol Paris",
                "Hotel Lutetia"
            },
            ["LON"] = new[]
            {
                "The Savoy",
                "Claridge's",
                "The Ritz London",
                "The Dorchester",
                "Mandarin Oriental Hyde Park",
                "The Langham London",
                "Shangri-La The Shard"
            },
            ["TYO"] = new[]
            {
                "Park Hyatt Tokyo",
                "Aman Tokyo",
                "The Peninsula Tokyo",
                "Mandarin Oriental Tokyo",
                "Palace Hotel Tokyo",
                "The Ritz-Carlton Tokyo",
                "Conrad Tokyo"
            },
            ["IST"] = new[]
            {
                "Four Seasons Hotel Istanbul",
                "Ciragan Palace Kempinski",
                "The St. Regis Istanbul",
                "Raffles Istanbul",
                "Pera Palace Hotel",
                "Shangri-La Bosphorus",
                "Swissotel The Bosphorus"
            }
        };

        /// <summary>
        /// Generates 5 mock hotel offers for the given city, sorted by price ascending.
        /// </summary>
        public static Task<List<HotelOffer>> Search(string cityCode, string checkIn, string checkOut)
        {
            var hotelNames = CityHotels.ContainsKey(cityCode)
                ? CityHotels[cityCode]
                : GenerateGenericHotelNames(cityCode);

            // Shuffle and take 5
            var selected = hotelNames
                .OrderBy(_ => _random.Next())
                .Take(5)
                .ToList();

            var hotels = new List<HotelOffer>();

            foreach (var name in selected)
            {
                var pricePerNight = _random.Next(150, 801); // 150-800 EUR/night
                var category = RoomCategories[_random.Next(RoomCategories.Length)];

                // Calculate number of nights
                var nights = 1;
                if (DateTime.TryParse(checkIn, out var cin) && DateTime.TryParse(checkOut, out var cout))
                {
                    nights = Math.Max(1, (int)(cout - cin).TotalDays);
                }
                var totalPrice = pricePerNight * nights;

                var roomDescription = category switch
                {
                    "Standard" => "스탠다드 룸 - 도시 전망, 무료 Wi-Fi",
                    "Superior" => "슈페리어 룸 - 넓은 공간, 미니바 포함",
                    "Deluxe" => "디럭스 룸 - 프리미엄 전망, 라운지 이용",
                    "Suite" => "스위트 룸 - 거실 별도, 조식 포함",
                    _ => "컴포트 룸 - 기본 편의시설"
                };

                hotels.Add(new HotelOffer
                {
                    Hotel = new HotelInfo
                    {
                        Name = name,
                        CityCode = cityCode
                    },
                    Offers = new List<HotelRoom>
                    {
                        new HotelRoom
                        {
                            Room = new HotelRoomInfo
                            {
                                TypeEstimated = $"{category} Room",
                                Category = category
                            },
                            Price = new HotelRoomPrice
                            {
                                Total = totalPrice.ToString(),
                                Currency = "EUR"
                            },
                            Description = roomDescription
                        }
                    }
                });
            }

            // Sort by price ascending
            hotels = hotels
                .OrderBy(h => int.Parse(h.Offers.FirstOrDefault()?.Price.Total ?? "0"))
                .ToList();

            return Task.FromResult(hotels);
        }

        private static string[] GenerateGenericHotelNames(string cityCode)
        {
            return new[]
            {
                $"Grand Hotel {cityCode}",
                $"Palace Hotel {cityCode}",
                $"Royal {cityCode} Hotel",
                $"City Center Hotel {cityCode}",
                $"Park Hotel {cityCode}",
                $"Luxury Inn {cityCode}",
                $"Heritage Hotel {cityCode}"
            };
        }
    }
}
