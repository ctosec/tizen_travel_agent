namespace TravelAgent.Services
{
    /// <summary>
    /// Static configuration class holding API keys and base URLs.
    /// Values can be overridden via environment variables at runtime.
    /// </summary>
    public static class ApiConfig
    {
        public static readonly string GeminiApiKey = "";

        public static readonly string GeminiBaseUrl = "https://generativelanguage.googleapis.com";

        public static readonly string GooglePlacesApiKey = "";

        public static readonly string PaymentUrl = "";
    }
}
