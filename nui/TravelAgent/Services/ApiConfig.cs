namespace TravelAgent.Services
{
    /// <summary>
    /// Static configuration class holding API keys and base URLs.
    /// Values can be overridden via environment variables at runtime.
    /// </summary>
    public static class ApiConfig
    {
        public static readonly string GeminiApiKey =
            System.Environment.GetEnvironmentVariable("GEMINI_API_KEY")
            ?? "YOUR_GEMINI_API_KEY";

        public static readonly string GeminiBaseUrl =
            System.Environment.GetEnvironmentVariable("GEMINI_BASE_URL")
            ?? "https://generativelanguage.googleapis.com";

        public static readonly string GooglePlacesApiKey =
            System.Environment.GetEnvironmentVariable("GOOGLE_PLACES_API_KEY")
            ?? "YOUR_GOOGLE_PLACES_API_KEY";

        public static readonly string PaymentUrl =
            System.Environment.GetEnvironmentVariable("PAYMENT_URL")
            ?? "http://localhost:3000";
    }
}
