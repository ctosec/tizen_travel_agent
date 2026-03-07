using System;
using System.Linq;
using Tizen.NUI;
using Tizen.NUI.BaseComponents;
using TravelAgent.Models;
using TravelAgent.Utils;

namespace TravelAgent.Components
{
    public class HotelCard : View
    {
        private readonly View _cardView;
        private bool _selected;
        private readonly HotelOffer _hotel;

        public event Action<HotelOffer> Selected;

        public HotelCard(HotelOffer hotel, bool selected, int nights = 4, float width = 680f)
        {
            _hotel = hotel;
            _selected = selected;
            Focusable = true;
            Size = new Size(width, 130);
            CornerRadius = 16f;

            var offer = hotel.Offers?.FirstOrDefault();
            string hotelName = hotel.Hotel?.Name ?? "Hotel";
            string cityCode = hotel.Hotel?.CityCode ?? "";
            string roomType = offer?.Room?.Category ?? "Standard";
            string desc = offer?.Description ?? "";
            double pricePerNight = double.TryParse(offer?.Price?.Total, out var pp) ? pp : 200;
            string currency = offer?.Price?.Currency ?? "EUR";
            int totalKRW = Currency.ToKRW(pricePerNight * nights, currency);
            string totalPrice = Currency.FormatKRW(totalKRW);
            string nightsText = $"{nights}\ubc15 \ucd1d\uc561";

            _cardView = new View
            {
                Size = new Size(width, 130),
                CornerRadius = 16f,
                BackgroundColor = selected
                    ? new Color(16 / 255f, 185 / 255f, 129 / 255f, 0.1f)
                    : AppColors.White05,
                BorderlineWidth = 2f,
                BorderlineColor = selected ? AppColors.Emerald500 : AppColors.White10,
                Padding = new Extents(16, 16, 12, 12),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    VerticalAlignment = VerticalAlignment.Center,
                    CellPadding = new Size2D(12, 0)
                }
            };

            // Left: Hotel info
            var leftCol = new View
            {
                Size = new Size(width - 200, 106),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    CellPadding = new Size2D(0, 4)
                }
            };

            leftCol.Add(new TextLabel
            {
                Text = hotelName,
                TextColor = AppColors.White,
                PointSize = 15f,
                Ellipsis = true,
                Size = new Size(width - 220, 22),
            });

            leftCol.Add(new TextLabel
            {
                Text = cityCode,
                TextColor = AppColors.Indigo200,
                PointSize = 10f,
                Size = new Size(width - 220, 16),
            });

            // Room type badge
            var badge = new TextLabel
            {
                Text = roomType,
                TextColor = AppColors.Indigo200,
                PointSize = 10f,
                BackgroundColor = AppColors.White10,
                Padding = new Extents(8, 8, 2, 2),
                Size = new Size(100, 18),
            };
            leftCol.Add(badge);

            if (!string.IsNullOrEmpty(desc))
            {
                leftCol.Add(new TextLabel
                {
                    Text = desc,
                    TextColor = AppColors.Indigo300,
                    PointSize = 10f,
                    MultiLine = true,
                    Ellipsis = true,
                    Size = new Size(width - 220, 30),
                });
            }
            _cardView.Add(leftCol);

            // Right: Price
            var rightCol = new View
            {
                Size = new Size(160, 106),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    HorizontalAlignment = HorizontalAlignment.End,
                    VerticalAlignment = VerticalAlignment.Center,
                    CellPadding = new Size2D(0, 2)
                }
            };

            rightCol.Add(new TextLabel
            {
                Text = totalPrice,
                TextColor = AppColors.White,
                PointSize = 16f,
                HorizontalAlignment = HorizontalAlignment.End,
                Size = new Size(160, 24),
            });
            rightCol.Add(new TextLabel
            {
                Text = nightsText,
                TextColor = AppColors.Indigo300,
                PointSize = 10f,
                HorizontalAlignment = HorizontalAlignment.End,
                Size = new Size(160, 16),
            });

            if (selected)
            {
                var check = new TextLabel
                {
                    Text = "\u2713",
                    TextColor = AppColors.White,
                    PointSize = 14f,
                    BackgroundColor = AppColors.Emerald500,
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
                ? new Color(16 / 255f, 185 / 255f, 129 / 255f, 0.1f)
                : AppColors.White05;
            _cardView.BorderlineColor = sel ? AppColors.Emerald500 : AppColors.White10;
        }

        private void OnFocusGained(object sender, EventArgs e)
        {
            BorderlineColor = AppColors.Emerald400;
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
                Selected?.Invoke(_hotel);
                return true;
            }
            return false;
        }
    }
}
