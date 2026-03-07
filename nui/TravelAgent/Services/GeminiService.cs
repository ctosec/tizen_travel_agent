using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace TravelAgent.Services
{
    public static class GeminiService
    {
        private static readonly HttpClient _client = new HttpClient();

        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        /// <summary>
        /// Sends a prompt to the Gemini REST API and returns the raw text response.
        /// </summary>
        public static async Task<string> GenerateText(string prompt)
        {
            try
            {
                var url = $"{ApiConfig.GeminiBaseUrl}/v1beta/models/gemini-2.5-flash:generateContent?key={ApiConfig.GeminiApiKey}";

                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = prompt }
                            }
                        }
                    }
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _client.PostAsync(url, content);
                response.EnsureSuccessStatusCode();

                var responseJson = await response.Content.ReadAsStringAsync();
                var geminiResponse = JsonSerializer.Deserialize<GeminiResponse>(responseJson, _jsonOptions);

                if (geminiResponse?.Candidates != null &&
                    geminiResponse.Candidates.Count > 0 &&
                    geminiResponse.Candidates[0].Content?.Parts != null &&
                    geminiResponse.Candidates[0].Content.Parts.Count > 0)
                {
                    return geminiResponse.Candidates[0].Content.Parts[0].Text ?? "";
                }

                return "";
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[GeminiService] GenerateText error: {ex.Message}");
                return "";
            }
        }

        /// <summary>
        /// Sends a prompt to the Gemini REST API and deserializes the response as JSON into type T.
        /// Strips markdown code fences if present.
        /// </summary>
        public static async Task<T> GenerateJson<T>(string prompt) where T : new()
        {
            try
            {
                var text = await GenerateText(prompt);

                if (string.IsNullOrWhiteSpace(text))
                    return new T();

                // Strip markdown code fences (```json ... ```)
                text = text.Trim();
                if (text.StartsWith("```"))
                {
                    var firstNewline = text.IndexOf('\n');
                    if (firstNewline >= 0)
                        text = text.Substring(firstNewline + 1);

                    if (text.EndsWith("```"))
                        text = text.Substring(0, text.Length - 3);

                    text = text.Trim();
                }

                return JsonSerializer.Deserialize<T>(text, _jsonOptions) ?? new T();
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[GeminiService] GenerateJson error: {ex.Message}");
                return new T();
            }
        }

        #region Gemini Response Models

        private class GeminiResponse
        {
            [JsonPropertyName("candidates")]
            public System.Collections.Generic.List<GeminiCandidate> Candidates { get; set; }
        }

        private class GeminiCandidate
        {
            [JsonPropertyName("content")]
            public GeminiContent Content { get; set; }
        }

        private class GeminiContent
        {
            [JsonPropertyName("parts")]
            public System.Collections.Generic.List<GeminiPart> Parts { get; set; }
        }

        private class GeminiPart
        {
            [JsonPropertyName("text")]
            public string Text { get; set; }
        }

        #endregion
    }
}
