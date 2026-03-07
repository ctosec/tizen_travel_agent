using System;
using System.Collections.Generic;
using System.Globalization;

namespace TravelAgent.Utils
{
    public static class Currency
    {
        private static readonly Dictionary<string, double> RatesToKRW = new()
        {
            { "EUR", 1500 },
            { "USD", 1380 },
            { "GBP", 1750 },
            { "JPY", 9.2 },
            { "KRW", 1 }
        };

        public static int ToKRW(double amount, string currency = "EUR")
        {
            var rate = RatesToKRW.GetValueOrDefault(currency.ToUpper(), 1500);
            return (int)Math.Round(amount * rate);
        }

        public static string FormatKRW(int amount)
        {
            return $"\u20a9{amount:N0}";
        }

        public static string PriceToKRW(double amount, string currency = "EUR")
        {
            return FormatKRW(ToKRW(amount, currency));
        }
    }
}
