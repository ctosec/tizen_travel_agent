using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Tizen.NUI;
using Tizen.NUI.BaseComponents;
using TravelAgent.Components;
using TravelAgent.Models;
using TravelAgent.Services;
using TravelAgent.Utils;

namespace TravelAgent.Pages
{
    public class BookingPage : View
    {
        private readonly App _app;
        private View _flightList;
        private View _hotelList;
        private View _paymentPanel;
        private TextLabel _flightPriceLabel;
        private TextLabel _hotelPriceLabel;
        private TextLabel _totalPriceLabel;
        private TextLabel _statusLabel;
        private View _qrContainer;
        private View _methodsContainer;

        private List<FlightOffer> _flights = new();
        private List<HotelOffer> _hotels = new();
        private FlightOffer _selectedFlight;
        private HotelOffer _selectedHotel;
        private string _paymentMethod = "kakaopay";
        private string _paymentStatus = "IDLE";
        private string _orderId;
        private Timer _pollTimer;
        private int _nights;

        public BookingPage(App app)
        {
            _app = app;
            _nights = Math.Max(1, app.Duration - 1);
            BackgroundColor = AppColors.Transparent;
            Layout = new AbsoluteLayout();

            var bg = GradientBackground.Create(GradientType.Booking);
            Add(bg);

            var main = new View
            {
                Size = new Size(1920, 1080),
                Padding = new Extents(80, 80, 50, 40),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                }
            };

            // Header
            var header = new View
            {
                Size = new Size(1760, 56),
                Margin = new Extents(0, 0, 0, 12),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    VerticalAlignment = VerticalAlignment.Center,
                }
            };
            var titleCol = new View
            {
                Size = new Size(1200, 56),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                }
            };
            titleCol.Add(new TextLabel
            {
                Text = "\ud56d\uacf5\ud3b8 & \ud638\ud154 \uc120\ud0dd",
                TextColor = AppColors.White,
                PointSize = 32f,
                FontFamily = "SamsungOneUI",
                Size = new Size(800, 36),
            });
            titleCol.Add(new TextLabel
            {
                Text = $"{app.Duration}\uc77c \uc5ec\ud589 \u2014 \ud638\ud154 {_nights}\ubc15 (Day 1 ~ Day {app.Duration - 1})",
                TextColor = AppColors.Indigo200,
                PointSize = 14f,
                FontFamily = "SamsungOneUI",
                Size = new Size(800, 18),
            });
            header.Add(titleCol);
            main.Add(header);

            // 3-column grid
            var grid = new View
            {
                Size = new Size(1760, 920),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    CellPadding = new Size2D(24, 0)
                }
            };

            // Left: Flights
            var flightCol = CreateSection("\u2708\ufe0f \ud56d\uacf5\ud3b8", AppColors.Blue400, 640);
            _flightList = new View
            {
                Size = new Size(640, 840),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    CellPadding = new Size2D(0, 10)
                }
            };
            flightCol.Add(_flightList);
            grid.Add(flightCol);

            // Center: Hotels
            var hotelCol = CreateSection($"\ud83c\udfe8 \ud638\ud154 ({_nights}\ubc15)", AppColors.Emerald400, 640);
            _hotelList = new View
            {
                Size = new Size(640, 840),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    CellPadding = new Size2D(0, 10)
                }
            };
            hotelCol.Add(_hotelList);
            grid.Add(hotelCol);

            // Right: Payment panel
            _paymentPanel = new View
            {
                Size = new Size(400, 920),
                CornerRadius = 16f,
                BackgroundColor = AppColors.White05,
                BorderlineWidth = 1f,
                BorderlineColor = AppColors.White10,
                Padding = new Extents(20, 20, 20, 20),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    CellPadding = new Size2D(0, 8)
                }
            };

            _paymentPanel.Add(new TextLabel
            {
                Text = "\uacb0\uc81c",
                TextColor = AppColors.White,
                PointSize = 20f,
                FontFamily = "SamsungOneUI",
                Size = new Size(360, 28),
                Margin = new Extents(0, 0, 0, 8),
            });

            // Price summary
            _flightPriceLabel = CreatePriceRow("\ud56d\uacf5\ud3b8", "\u20a90");
            _hotelPriceLabel = CreatePriceRow($"\ud638\ud154 ({_nights}\ubc15)", "\u20a90");
            _paymentPanel.Add(_flightPriceLabel);
            _paymentPanel.Add(_hotelPriceLabel);

            var divider = new View
            {
                Size = new Size(360, 1),
                BackgroundColor = AppColors.White20,
                Margin = new Extents(0, 0, 4, 4),
            };
            _paymentPanel.Add(divider);

            _totalPriceLabel = new TextLabel
            {
                Text = "\ud569\uacc4: \u20a90",
                TextColor = AppColors.Emerald400,
                PointSize = 18f,
                FontFamily = "SamsungOneUI",
                HorizontalAlignment = HorizontalAlignment.End,
                Size = new Size(360, 26),
                Margin = new Extents(0, 0, 0, 12),
            };
            _paymentPanel.Add(_totalPriceLabel);

            // Payment methods
            _paymentPanel.Add(new TextLabel
            {
                Text = "\uacb0\uc81c \uc218\ub2e8 \uc120\ud0dd",
                TextColor = AppColors.Indigo300,
                PointSize = 13f,
                Size = new Size(360, 18),
                Margin = new Extents(0, 0, 0, 4),
            });

            _methodsContainer = new View
            {
                Size = new Size(360, 180),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    CellPadding = new Size2D(0, 8)
                }
            };
            AddPaymentMethod("\ud83d\udce8 \uce74\uce74\uc624\ud398\uc774", "kakaopay");
            AddPaymentMethod("\ud83d\udcb3 \ud1a0\uc2a4\ud398\uc774", "tosspay");
            AddPaymentMethod("\ud83d\udcf1 \uc0bc\uc131\ud398\uc774", "samsungpay");
            _paymentPanel.Add(_methodsContainer);

            // QR / Status area
            _qrContainer = new View
            {
                Size = new Size(360, 400),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                    CellPadding = new Size2D(0, 8)
                }
            };
            _statusLabel = new TextLabel
            {
                Text = "\ud56d\uacf5\ud3b8\uacfc \ud638\ud154\uc744 \ubaa8\ub450 \uc120\ud0dd\ud574\uc8fc\uc138\uc694",
                TextColor = AppColors.Indigo300,
                PointSize = 13f,
                MultiLine = true,
                HorizontalAlignment = HorizontalAlignment.Center,
                Size = new Size(360, 40),
            };
            _qrContainer.Add(_statusLabel);
            _paymentPanel.Add(_qrContainer);

            grid.Add(_paymentPanel);
            main.Add(grid);
            Add(main);

            _ = LoadBookingDataAsync();
        }

        private View CreateSection(string title, Color iconColor, float width)
        {
            var section = new View
            {
                Size = new Size(width, 920),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    CellPadding = new Size2D(0, 8)
                }
            };
            section.Add(new TextLabel
            {
                Text = title,
                TextColor = iconColor,
                PointSize = 22f,
                FontFamily = "SamsungOneUI",
                Size = new Size(width, 30),
                Margin = new Extents(0, 0, 0, 4),
            });
            return section;
        }

        private TextLabel CreatePriceRow(string label, string value)
        {
            var row = new TextLabel
            {
                Text = $"{label}: {value}",
                TextColor = AppColors.White,
                PointSize = 14f,
                Size = new Size(360, 22),
            };
            return row;
        }

        private void AddPaymentMethod(string label, string method)
        {
            var btn = new FocusableButton(label, 360, 48,
                method == _paymentMethod
                    ? new Color(16 / 255f, 185 / 255f, 129 / 255f, 0.2f)
                    : AppColors.White05,
                AppColors.White,
                AppColors.Purple400,
                15f, 12f);
            btn.Clicked += () =>
            {
                _paymentMethod = method;
                if (_selectedFlight != null && _selectedHotel != null)
                    _ = CreatePaymentSessionAsync();
            };
            _methodsContainer.Add(btn);
        }

        private async Task LoadBookingDataAsync()
        {
            var startDate = _app.StartDate;
            var endDate = DateTime.TryParse(startDate, out var sd)
                ? sd.AddDays(_nights).ToString("yyyy-MM-dd") : "";

            // Load flights and hotels in parallel
            var flightTask = MockFlightService.Search("ICN", _app.AirportCode, startDate);
            var hotelTask = MockHotelService.Search(_app.AirportCode, startDate, endDate);

            _flights = await flightTask;
            _hotels = await hotelTask;

            ShowFlights();
            ShowHotels();
        }

        private void ShowFlights()
        {
            while (_flightList.ChildCount > 0)
            {
                var c = _flightList.GetChildAt(0);
                _flightList.Remove(c);
                c.Dispose();
            }

            if (_flights.Count == 0)
            {
                _flightList.Add(new TextLabel
                {
                    Text = "\uac80\uc0c9 \uacb0\uacfc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4",
                    TextColor = AppColors.Indigo300,
                    PointSize = 14f,
                    Size = new Size(640, 40),
                });
                return;
            }

            for (int i = 0; i < _flights.Count; i++)
            {
                var f = _flights[i];
                var card = new FlightCard(f, f == _selectedFlight, 620);
                card.Selected += OnFlightSelected;
                _flightList.Add(card);
            }

            // Focus first flight
            if (_flightList.ChildCount > 0)
            {
                var focusTimer = new Timer(300);
                focusTimer.Tick += (s, e) =>
                {
                    FocusManager.Instance.SetCurrentFocusView(_flightList.GetChildAt(0));
                    focusTimer.Stop();
                    focusTimer.Dispose();
                    return false;
                };
                focusTimer.Start();
            }
        }

        private void ShowHotels()
        {
            while (_hotelList.ChildCount > 0)
            {
                var c = _hotelList.GetChildAt(0);
                _hotelList.Remove(c);
                c.Dispose();
            }

            if (_hotels.Count == 0)
            {
                _hotelList.Add(new TextLabel
                {
                    Text = "\uac80\uc0c9 \uacb0\uacfc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4",
                    TextColor = AppColors.Indigo300,
                    PointSize = 14f,
                    Size = new Size(640, 40),
                });
                return;
            }

            for (int i = 0; i < _hotels.Count; i++)
            {
                var h = _hotels[i];
                var card = new HotelCard(h, h == _selectedHotel, _nights, 620);
                card.Selected += OnHotelSelected;
                _hotelList.Add(card);
            }
        }

        private void OnFlightSelected(FlightOffer flight)
        {
            _selectedFlight = flight;
            _app.SelectedFlight = flight;
            ShowFlights();
            UpdatePrices();
        }

        private void OnHotelSelected(HotelOffer hotel)
        {
            _selectedHotel = hotel;
            _app.SelectedHotel = hotel;
            ShowHotels();
            UpdatePrices();
        }

        private void UpdatePrices()
        {
            int flightKRW = 0;
            int hotelKRW = 0;

            if (_selectedFlight != null)
            {
                double fp = double.TryParse(_selectedFlight.Price?.Total, out var v) ? v : 0;
                flightKRW = Currency.ToKRW(fp, _selectedFlight.Price?.Currency ?? "EUR");
            }

            if (_selectedHotel != null)
            {
                var offer = _selectedHotel.Offers?.Count > 0 ? _selectedHotel.Offers[0] : null;
                double hp = double.TryParse(offer?.Price?.Total, out var v2) ? v2 : 0;
                hotelKRW = Currency.ToKRW(hp * _nights, offer?.Price?.Currency ?? "EUR");
            }

            _flightPriceLabel.Text = $"\ud56d\uacf5\ud3b8: {Currency.FormatKRW(flightKRW)}";
            _hotelPriceLabel.Text = $"\ud638\ud154 ({_nights}\ubc15): {Currency.FormatKRW(hotelKRW)}";
            _totalPriceLabel.Text = $"\ud569\uacc4: {Currency.FormatKRW(flightKRW + hotelKRW)}";

            if (_selectedFlight != null && _selectedHotel != null)
            {
                _statusLabel.Text = "\uacb0\uc81c \uc218\ub2e8\uc744 \uc120\ud0dd\ud558\uba74 QR\uc774 \uc0dd\uc131\ub429\ub2c8\ub2e4";
            }
        }

        private async Task CreatePaymentSessionAsync()
        {
            if (_selectedFlight == null || _selectedHotel == null) return;

            _statusLabel.Text = "\uacb0\uc81c \uc138\uc158 \uc0dd\uc131\uc911...";

            try
            {
                int flightKRW = 0, hotelKRW = 0;
                if (_selectedFlight != null)
                {
                    double fp = double.TryParse(_selectedFlight.Price?.Total, out var v) ? v : 0;
                    flightKRW = Currency.ToKRW(fp, _selectedFlight.Price?.Currency ?? "EUR");
                }
                if (_selectedHotel != null)
                {
                    var offer = _selectedHotel.Offers?.Count > 0 ? _selectedHotel.Offers[0] : null;
                    double hp = double.TryParse(offer?.Price?.Total, out var v2) ? v2 : 0;
                    hotelKRW = Currency.ToKRW(hp * _nights, offer?.Price?.Currency ?? "EUR");
                }
                int totalAmount = flightKRW + hotelKRW;

                string orderId = $"TA-{DateTime.Now:yyyyMMddHHmmss}-{new Random().Next(1000, 9999)}";
                var session = await PaymentService.CreateSession(
                    orderId, totalAmount,
                    $"{_app.City} \uc5ec\ud589 \ud328\ud0a4\uc9c0",
                    _paymentMethod);

                if (session != null && !string.IsNullOrEmpty(session.OrderId))
                {
                    _orderId = session.OrderId;
                    _paymentStatus = "PENDING";
                    var externalUrl = await PaymentService.GetExternalBaseUrl();
                    string checkoutUrl = PaymentService.GetCheckoutUrl(
                        _orderId, totalAmount,
                        $"{_app.City} \uc5ec\ud589 \ud328\ud0a4\uc9c0",
                        _paymentMethod, externalUrl);

                    ShowQRCode(checkoutUrl, totalAmount);
                    StartPolling();
                }
            }
            catch (Exception ex)
            {
                _statusLabel.Text = $"\uacb0\uc81c \uc138\uc158 \uc0dd\uc131 \uc2e4\ud328: {ex.Message}";
            }
        }

        private void ShowQRCode(string url, int amount)
        {
            // Clear existing QR area
            while (_qrContainer.ChildCount > 0)
            {
                var c = _qrContainer.GetChildAt(0);
                _qrContainer.Remove(c);
                c.Dispose();
            }

            // Generate QR code using public API
            var encodedUrl = Uri.EscapeDataString(url);
            var qrImageUrl = $"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encodedUrl}";
            var qrImage = new ImageView
            {
                Size = new Size(200, 200),
                CornerRadius = 12f,
                ResourceUrl = qrImageUrl,
                DesiredWidth = 200,
                DesiredHeight = 200,
                BackgroundColor = AppColors.White,
                ClippingMode = ClippingModeType.ClipToBoundingBox,
            };
            _qrContainer.Add(qrImage);

            _qrContainer.Add(new TextLabel
            {
                Text = Currency.FormatKRW(amount),
                TextColor = AppColors.Emerald400,
                PointSize = 28f,
                HorizontalAlignment = HorizontalAlignment.Center,
                Size = new Size(360, 36),
            });

            _qrContainer.Add(new TextLabel
            {
                Text = "\ubaa8\ubc14\uc77c\ub85c QR\uc744 \uc2a4\uce94\ud558\uc138\uc694",
                TextColor = AppColors.Indigo300,
                PointSize = 13f,
                HorizontalAlignment = HorizontalAlignment.Center,
                Size = new Size(360, 20),
            });
        }

        private void StartPolling()
        {
            StopPolling();
            _pollTimer = new Timer(2000);
            _pollTimer.Tick += (s, e) =>
            {
                _ = PollStatusAsync();
                return true;
            };
            _pollTimer.Start();
        }

        private async Task PollStatusAsync()
        {
            try
            {
                var status = await PaymentService.GetStatus(_orderId);
                if (status?.Status == "SUCCESS")
                {
                    _paymentStatus = "SUCCESS";
                    ShowSuccess();
                    StopPolling();
                }
                else if (status?.Status == "FAIL" || status?.Status == "EXPIRED")
                {
                    _paymentStatus = "FAIL";
                    ShowFailure();
                    StopPolling();
                }
            }
            catch { }
        }

        private void StopPolling()
        {
            if (_pollTimer != null)
            {
                _pollTimer.Stop();
                _pollTimer.Dispose();
                _pollTimer = null;
            }
        }

        private void ShowSuccess()
        {
            while (_qrContainer.ChildCount > 0)
            {
                var c = _qrContainer.GetChildAt(0);
                _qrContainer.Remove(c);
                c.Dispose();
            }

            _qrContainer.Add(new TextLabel
            {
                Text = "\u2705",
                PointSize = 50f,
                HorizontalAlignment = HorizontalAlignment.Center,
                Size = new Size(360, 60),
            });
            _qrContainer.Add(new TextLabel
            {
                Text = "\uacb0\uc81c \uc644\ub8cc!",
                TextColor = AppColors.Emerald400,
                PointSize = 24f,
                HorizontalAlignment = HorizontalAlignment.Center,
                Size = new Size(360, 32),
            });
            _qrContainer.Add(new TextLabel
            {
                Text = "\uc608\uc57d\uc774 \ud655\uc778\ub418\uc5c8\uc2b5\ub2c8\ub2e4",
                TextColor = AppColors.Indigo200,
                PointSize = 14f,
                HorizontalAlignment = HorizontalAlignment.Center,
                Size = new Size(360, 20),
            });
        }

        private void ShowFailure()
        {
            while (_qrContainer.ChildCount > 0)
            {
                var c = _qrContainer.GetChildAt(0);
                _qrContainer.Remove(c);
                c.Dispose();
            }

            _qrContainer.Add(new TextLabel
            {
                Text = "\uacb0\uc81c\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.\n\ub2e4\uc2dc \uc2dc\ub3c4\ud574\uc8fc\uc138\uc694.",
                TextColor = AppColors.Red400,
                PointSize = 16f,
                MultiLine = true,
                HorizontalAlignment = HorizontalAlignment.Center,
                Size = new Size(360, 60),
            });
        }
    }
}
