using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using TravelAgent.Models;

namespace TravelAgent.Services
{
    public static class PaymentService
    {
        private static readonly HttpClient _client = new HttpClient();
        private static string _externalBaseUrl;

        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        /// <summary>
        /// Fetches the server's externally accessible base URL (LAN IP) for QR codes.
        /// </summary>
        public static async Task<string> GetExternalBaseUrl()
        {
            if (_externalBaseUrl != null) return _externalBaseUrl;
            try
            {
                var response = await _client.GetStringAsync($"{ApiConfig.PaymentUrl}/api/server-info");
                using var doc = JsonDocument.Parse(response);
                _externalBaseUrl = doc.RootElement.GetProperty("baseUrl").GetString();
            }
            catch
            {
                _externalBaseUrl = ApiConfig.PaymentUrl;
            }
            return _externalBaseUrl;
        }

        /// <summary>
        /// Creates a new payment session on the payment server.
        /// </summary>
        public static async Task<PaymentSession> CreateSession(
            string orderId, int amount, string orderName, string method)
        {
            try
            {
                var url = $"{ApiConfig.PaymentUrl}/api/payments/sessions";

                var requestBody = new
                {
                    orderId,
                    amount,
                    orderName,
                    method
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _client.PostAsync(url, content);
                response.EnsureSuccessStatusCode();

                var responseJson = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<PaymentSession>(responseJson, _jsonOptions)
                       ?? new PaymentSession { OrderId = orderId, Status = "ERROR" };
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[PaymentService] CreateSession error: {ex.Message}");
                return new PaymentSession { OrderId = orderId, Status = "ERROR" };
            }
        }

        /// <summary>
        /// Retrieves the status of an existing payment session.
        /// </summary>
        public static async Task<PaymentSession> GetStatus(string orderId)
        {
            try
            {
                var url = $"{ApiConfig.PaymentUrl}/api/payments/sessions/{orderId}/status";

                var response = await _client.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var responseJson = await response.Content.ReadAsStringAsync();
                return JsonSerializer.Deserialize<PaymentSession>(responseJson, _jsonOptions)
                       ?? new PaymentSession { OrderId = orderId, Status = "UNKNOWN" };
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[PaymentService] GetStatus error: {ex.Message}");
                return new PaymentSession { OrderId = orderId, Status = "ERROR" };
            }
        }

        /// <summary>
        /// Returns the checkout page URL for QR code display.
        /// </summary>
        public static string GetCheckoutUrl(string orderId, int amount, string orderName, string method, string baseUrl = null)
        {
            var url = baseUrl ?? ApiConfig.PaymentUrl;
            var encodedOrderName = Uri.EscapeDataString(orderName);
            var encodedMethod = Uri.EscapeDataString(method);
            return $"{url}/api/payments/checkout?orderId={orderId}&amount={amount}&orderName={encodedOrderName}&method={encodedMethod}";
        }
    }
}
