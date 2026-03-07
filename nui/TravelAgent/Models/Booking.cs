using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace TravelAgent.Models
{
    public class FlightOffer
    {
        public string Id { get; set; } = "";
        public FlightPrice Price { get; set; } = new();
        public List<FlightItinerary> Itineraries { get; set; } = new();
    }

    public class FlightPrice
    {
        public string Total { get; set; } = "0";
        public string Currency { get; set; } = "EUR";
    }

    public class FlightItinerary
    {
        public string Duration { get; set; } = "";
        public List<FlightSegment> Segments { get; set; } = new();
    }

    public class FlightSegment
    {
        public FlightEndpoint Departure { get; set; } = new();
        public FlightEndpoint Arrival { get; set; } = new();
        public string CarrierCode { get; set; } = "";
        public string Number { get; set; } = "";
    }

    public class FlightEndpoint
    {
        public string IataCode { get; set; } = "";
        public string At { get; set; } = "";
    }

    public class HotelOffer
    {
        public HotelInfo Hotel { get; set; } = new();
        public List<HotelRoom> Offers { get; set; } = new();
    }

    public class HotelInfo
    {
        public string Name { get; set; } = "";
        public string CityCode { get; set; } = "";
    }

    public class HotelRoom
    {
        public HotelRoomInfo Room { get; set; } = new();
        public HotelRoomPrice Price { get; set; } = new();
        public string Description { get; set; } = "";
    }

    public class HotelRoomInfo
    {
        public string TypeEstimated { get; set; } = "";
        public string Category { get; set; } = "";
    }

    public class HotelRoomPrice
    {
        public string Total { get; set; } = "0";
        public string Currency { get; set; } = "EUR";
    }

    public class TravelerData
    {
        public string LastName { get; set; } = "";
        public string FirstName { get; set; } = "";
        public string Email { get; set; } = "";
        public string Phone { get; set; } = "";
        public string DateOfBirth { get; set; } = "";
        public string Gender { get; set; } = "";
        public string CountryCode { get; set; } = "KR";
        public string PassportNumber { get; set; } = "";
        public string PassportExpiry { get; set; } = "";
        public string Nationality { get; set; } = "";

        public bool IsValid =>
            !string.IsNullOrWhiteSpace(LastName) &&
            !string.IsNullOrWhiteSpace(FirstName) &&
            !string.IsNullOrWhiteSpace(Email) &&
            !string.IsNullOrWhiteSpace(Phone);
    }

    public class PaymentSession
    {
        [JsonPropertyName("orderId")]
        public string OrderId { get; set; } = "";
        [JsonPropertyName("status")]
        public string Status { get; set; } = "IDLE";
    }
}
