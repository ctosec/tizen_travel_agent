using System;
using System.Linq;
using Tizen.NUI;
using Tizen.NUI.BaseComponents;
using TravelAgent.Models;
using TravelAgent.Utils;

namespace TravelAgent.Components
{
    public class FlightCard : View
    {
        private readonly View _cardView;
        private bool _selected;
        private readonly FlightOffer _flight;

        public event Action<FlightOffer> Selected;

        public FlightCard(FlightOffer flight, bool selected, float width = 680f)
        {
            _flight = flight;
            _selected = selected;
            Focusable = true;
            Size = new Size(width, 120);
            CornerRadius = 16f;

            var itin = flight.Itineraries?.FirstOrDefault();
            var segments = itin?.Segments ?? new();
            var first = segments.FirstOrDefault();
            var last = segments.LastOrDefault();
            int stops = segments.Count - 1;
            string airline = first?.CarrierCode ?? "??";
            string flightNum = $"{airline}{first?.Number ?? "000"}";
            string depTime = first?.Departure?.At?.Length >= 16
                ? first.Departure.At.Substring(11, 5) : "--:--";
            string arrTime = last?.Arrival?.At?.Length >= 16
                ? last.Arrival.At.Substring(11, 5) : "--:--";
            string depCode = first?.Departure?.IataCode ?? "???";
            string arrCode = last?.Arrival?.IataCode ?? "???";
            string duration = itin?.Duration?.Replace("PT", "")
                .Replace("H", "h ").Replace("M", "m").Trim() ?? "";
            string stopsText = stops == 0 ? "\uc9c1\ud56d" : $"{stops}\ud68c \uacbd\uc720";
            string priceKRW = Currency.PriceToKRW(
                double.TryParse(flight.Price?.Total, out var p) ? p : 0,
                flight.Price?.Currency ?? "EUR");

            _cardView = new View
            {
                Size = new Size(width, 120),
                CornerRadius = 16f,
                BackgroundColor = selected
                    ? new Color(59 / 255f, 130 / 255f, 246 / 255f, 0.1f)
                    : AppColors.White05,
                BorderlineWidth = 2f,
                BorderlineColor = selected ? AppColors.Blue500 : AppColors.White10,
                Padding = new Extents(16, 16, 12, 12),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    VerticalAlignment = VerticalAlignment.Center,
                    CellPadding = new Size2D(12, 0)
                }
            };

            // Left: Airline info
            var leftCol = new View
            {
                Size = new Size(120, 96),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    CellPadding = new Size2D(0, 2)
                }
            };
            leftCol.Add(new TextLabel
            {
                Text = GetAirlineName(airline),
                TextColor = AppColors.White,
                PointSize = 16f,
                Size = new Size(120, 24),
                Ellipsis = true,
            });
            leftCol.Add(new TextLabel
            {
                Text = flightNum,
                TextColor = AppColors.Indigo300,
                PointSize = 12f,
                Size = new Size(120, 18),
            });
            _cardView.Add(leftCol);

            // Center: Route
            var centerCol = new View
            {
                Size = new Size(width - 300, 96),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    CellPadding = new Size2D(0, 2)
                }
            };

            var routeRow = new View
            {
                Size = new Size(width - 300, 40),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                    CellPadding = new Size2D(8, 0)
                }
            };

            var depCol = new View
            {
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    HorizontalAlignment = HorizontalAlignment.Center,
                }
            };
            depCol.Add(new TextLabel { Text = depTime, TextColor = AppColors.White, PointSize = 15f, HorizontalAlignment = HorizontalAlignment.Center, Size = new Size(60, 22) });
            depCol.Add(new TextLabel { Text = depCode, TextColor = AppColors.Indigo200, PointSize = 10f, HorizontalAlignment = HorizontalAlignment.Center, Size = new Size(60, 16) });
            routeRow.Add(depCol);

            // Arrow separator
            var sep = new View
            {
                Size = new Size(100, 30),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                }
            };
            var line = new View { Size = new Size(80, 1), BackgroundColor = AppColors.White20 };
            sep.Add(line);
            sep.Add(new TextLabel
            {
                Text = stopsText,
                TextColor = AppColors.Indigo300,
                PointSize = 10f,
                HorizontalAlignment = HorizontalAlignment.Center,
                Size = new Size(100, 14),
            });
            routeRow.Add(sep);

            var arrCol = new View
            {
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    HorizontalAlignment = HorizontalAlignment.Center,
                }
            };
            arrCol.Add(new TextLabel { Text = arrTime, TextColor = AppColors.White, PointSize = 15f, HorizontalAlignment = HorizontalAlignment.Center, Size = new Size(60, 22) });
            arrCol.Add(new TextLabel { Text = arrCode, TextColor = AppColors.Indigo200, PointSize = 10f, HorizontalAlignment = HorizontalAlignment.Center, Size = new Size(60, 16) });
            routeRow.Add(arrCol);

            centerCol.Add(routeRow);
            centerCol.Add(new TextLabel
            {
                Text = duration,
                TextColor = AppColors.Indigo300,
                PointSize = 10f,
                HorizontalAlignment = HorizontalAlignment.Center,
                Size = new Size(width - 300, 16),
            });
            _cardView.Add(centerCol);

            // Right: Price
            var rightCol = new View
            {
                Size = new Size(140, 96),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    HorizontalAlignment = HorizontalAlignment.End,
                    VerticalAlignment = VerticalAlignment.Center,
                }
            };
            rightCol.Add(new TextLabel
            {
                Text = priceKRW,
                TextColor = AppColors.White,
                PointSize = 18f,
                HorizontalAlignment = HorizontalAlignment.End,
                Size = new Size(140, 28),
            });

            if (selected)
            {
                var check = new TextLabel
                {
                    Text = "\u2713",
                    TextColor = AppColors.White,
                    PointSize = 14f,
                    BackgroundColor = AppColors.Blue500,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                    Size = new Size(24, 24),
                    CornerRadius = 12f,
                };
                rightCol.Add(check);
            }
            _cardView.Add(rightCol);

            Add(_cardView);

            FocusGained += OnFocusGained;
            FocusLost += OnFocusLost;
            KeyEvent += OnKeyEvent;
        }

        public void SetSelected(bool sel)
        {
            _selected = sel;
            _cardView.BackgroundColor = sel
                ? new Color(59 / 255f, 130 / 255f, 246 / 255f, 0.1f)
                : AppColors.White05;
            _cardView.BorderlineColor = sel ? AppColors.Blue500 : AppColors.White10;
        }

        private void OnFocusGained(object sender, EventArgs e)
        {
            BorderlineColor = AppColors.Blue400;
            BorderlineWidth = 3f;
            BorderlineOffset = -1f;
        }

        private void OnFocusLost(object sender, EventArgs e)
        {
            BorderlineWidth = 0f;
        }

        private bool OnKeyEvent(object sender, KeyEventArgs e)
        {
            if (e.Key.State == Key.StateType.Down &&
                (e.Key.KeyPressedName == "Return" || e.Key.KeyPressedName == "Enter"))
            {
                Selected?.Invoke(_flight);
                return true;
            }
            return false;
        }

        private static string GetAirlineName(string code) => code switch
        {
            "KE" => "Korean Air",
            "OZ" => "Asiana",
            "LH" => "Lufthansa",
            "AF" => "Air France",
            "BA" => "British Air",
            "TK" => "Turkish Air",
            "EK" => "Emirates",
            "SQ" => "Singapore",
            _ => code
        };
    }
}
