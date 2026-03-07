using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading.Tasks;
using Tizen.NUI;
using Tizen.NUI.BaseComponents;
using TravelAgent.Components;
using TravelAgent.Models;
using TravelAgent.Services;
using TravelAgent.Utils;

namespace TravelAgent.Pages
{
    public class ItineraryPage : View
    {
        private readonly App _app;
        private View _carouselContainer;
        private View _carouselInner;
        private View _dotsContainer;
        private LoadingSpinner _spinner;
        private TextLabel _dateLabel;
        private TextLabel _durationLabel;
        private FocusableButton _nextButton;
        private List<ItineraryDay> _days = new();
        private int _startIndex = 0;
        private const int PAGE_SIZE = 5;
        private DateTime _startDate;
        private int _duration;

        public ItineraryPage(App app)
        {
            _app = app;
            _startDate = DateTime.TryParse(app.StartDate, out var d) ? d : DateTime.Now.AddDays(14);
            _duration = app.Duration;
            BackgroundColor = AppColors.Transparent;
            Layout = new AbsoluteLayout();

            var bg = GradientBackground.Create(GradientType.Itinerary);
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

            // Header row
            var header = new View
            {
                Size = new Size(1760, 60),
                Margin = new Extents(0, 0, 0, 12),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    VerticalAlignment = VerticalAlignment.Center,
                }
            };

            // Left: title
            var titleCol = new View
            {
                Size = new Size(600, 60),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                }
            };
            titleCol.Add(new TextLabel
            {
                Text = "\uc5ec\ud589 \uc77c\uc815",
                TextColor = AppColors.White,
                PointSize = 32f,
                FontFamily = "SamsungOneUI",
                Size = new Size(600, 36),
            });
            titleCol.Add(new TextLabel
            {
                Text = $"{app.City}, {app.Country} \u2014 AI\uac00 \uc0dd\uc131\ud55c \ub9de\ucda4 \uc77c\uc815",
                TextColor = AppColors.Purple200,
                PointSize = 15f,
                FontFamily = "SamsungOneUI",
                Size = new Size(600, 22),
            });
            header.Add(titleCol);

            // Right: controls
            var controls = new View
            {
                Size = new Size(1160, 50),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    HorizontalAlignment = HorizontalAlignment.End,
                    VerticalAlignment = VerticalAlignment.Center,
                    CellPadding = new Size2D(16, 0)
                }
            };

            // Date picker
            var datePicker = new View
            {
                Size = new Size(320, 44),
                CornerRadius = 22f,
                BackgroundColor = AppColors.White10,
                BorderlineWidth = 1f,
                BorderlineColor = AppColors.White20,
                Padding = new Extents(16, 16, 0, 0),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                    CellPadding = new Size2D(8, 0)
                }
            };
            var datePrev = new FocusableButton("\u25c0", 36, 36, AppColors.Transparent, AppColors.White, AppColors.Purple400, 18f, 18f);
            datePrev.Clicked += () => ChangeDate(-1);
            datePicker.Add(datePrev);
            _dateLabel = new TextLabel
            {
                Text = _startDate.ToString("yyyy-MM-dd"),
                TextColor = AppColors.White,
                PointSize = 16f,
                HorizontalAlignment = HorizontalAlignment.Center,
                Size = new Size(140, 30),
            };
            datePicker.Add(_dateLabel);
            var dateNext = new FocusableButton("\u25b6", 36, 36, AppColors.Transparent, AppColors.White, AppColors.Purple400, 18f, 18f);
            dateNext.Clicked += () => ChangeDate(1);
            datePicker.Add(dateNext);
            controls.Add(datePicker);

            // Duration picker
            var durPicker = new View
            {
                Size = new Size(220, 44),
                CornerRadius = 22f,
                BackgroundColor = AppColors.White10,
                BorderlineWidth = 1f,
                BorderlineColor = AppColors.White20,
                Padding = new Extents(16, 16, 0, 0),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                    CellPadding = new Size2D(8, 0)
                }
            };
            var durMinus = new FocusableButton("\u25c0", 36, 36, AppColors.Transparent, AppColors.White, AppColors.Purple400, 18f, 18f);
            durMinus.Clicked += () => ChangeDuration(-1);
            durPicker.Add(durMinus);
            _durationLabel = new TextLabel
            {
                Text = $"{_duration}\uc77c",
                TextColor = AppColors.White,
                PointSize = 16f,
                HorizontalAlignment = HorizontalAlignment.Center,
                Size = new Size(60, 30),
            };
            durPicker.Add(_durationLabel);
            var durPlus = new FocusableButton("\u25b6", 36, 36, AppColors.Transparent, AppColors.White, AppColors.Purple400, 18f, 18f);
            durPlus.Clicked += () => ChangeDuration(1);
            durPicker.Add(durPlus);
            controls.Add(durPicker);

            // Regenerate button
            var regenBtn = new FocusableButton("\uc77c\uc815 \uc7ac\uc0dd\uc131", 160, 44,
                new Color(168 / 255f, 85 / 255f, 247 / 255f, 0.2f),
                AppColors.Purple200, AppColors.Purple400, 16f, 22f);
            regenBtn.Clicked += () => _ = LoadItineraryAsync();
            controls.Add(regenBtn);
            header.Add(controls);
            main.Add(header);

            // Carousel area
            _carouselContainer = new View
            {
                Size = new Size(1760, 800),
                ClippingMode = ClippingModeType.ClipToBoundingBox,
                Layout = new AbsoluteLayout()
            };

            _carouselInner = new View
            {
                Size = new Size(1760 * 3, 800),
                Position = new Position(0, 0),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                }
            };
            _carouselContainer.Add(_carouselInner);
            main.Add(_carouselContainer);

            // Dots + Next button row
            var bottomRow = new View
            {
                Size = new Size(1760, 60),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    VerticalAlignment = VerticalAlignment.Center,
                }
            };

            // Dots (left spacer + center dots + right button)
            var spacer = new View { Size = new Size(600, 60) };
            bottomRow.Add(spacer);

            _dotsContainer = new View
            {
                Size = new Size(560, 60),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                    CellPadding = new Size2D(8, 0)
                }
            };
            bottomRow.Add(_dotsContainer);

            var btnArea = new View
            {
                Size = new Size(600, 60),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    HorizontalAlignment = HorizontalAlignment.End,
                    VerticalAlignment = VerticalAlignment.Center,
                }
            };
            _nextButton = new FocusableButton(
                "\ud56d\uacf5\ud3b8 & \ud638\ud154 \uc608\uc57d  \u27a1",
                300, 52,
                fontSize: 18f,
                focusBorderColor: AppColors.Purple400,
                cornerRadius: 9999f
            );
            _nextButton.SetGradientBackground(AppColors.Purple500, AppColors.Pink600);
            _nextButton.Clicked += () =>
            {
                _app.ItineraryDays = _days;
                _app.Duration = _duration;
                _app.StartDate = _startDate.ToString("yyyy-MM-dd");
                _app.NavigateTo(App.PageType.Traveler);
            };
            btnArea.Add(_nextButton);
            bottomRow.Add(btnArea);
            main.Add(bottomRow);

            Add(main);

            _ = LoadItineraryAsync();
        }

        private void ChangeDate(int delta)
        {
            _startDate = _startDate.AddDays(delta);
            _dateLabel.Text = _startDate.ToString("yyyy-MM-dd");
        }

        private void ChangeDuration(int delta)
        {
            _duration = Math.Clamp(_duration + delta, 2, 14);
            _durationLabel.Text = $"{_duration}\uc77c";
        }

        private async Task LoadItineraryAsync()
        {
            // Show loading
            ClearCarousel();
            _spinner = new LoadingSpinner("AI\uac00 \uc77c\uc815\uc744 \uc0dd\uc131\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4...");
            _spinner.Size = new Size(1760, 800);
            _carouselContainer.Add(_spinner);

            try
            {
                var input = new ItineraryInput
                {
                    Country = _app.Country,
                    City = _app.City,
                    Duration = _duration,
                    StartDate = _startDate.ToString("yyyy-MM-dd")
                };
                _days = await ItineraryService.GenerateItinerary(input);
                ShowDays();
            }
            catch (Exception)
            {
                _days = new List<ItineraryDay>();
                ShowDays();
            }
        }

        private void ClearCarousel()
        {
            if (_spinner != null)
            {
                _spinner.Stop();
                _carouselContainer.Remove(_spinner);
                _spinner.Dispose();
                _spinner = null;
            }

            // Remove all children from inner
            while (_carouselInner.ChildCount > 0)
            {
                var child = _carouselInner.GetChildAt(0);
                _carouselInner.Remove(child);
                child.Dispose();
            }

            // Clear dots
            while (_dotsContainer.ChildCount > 0)
            {
                var child = _dotsContainer.GetChildAt(0);
                _dotsContainer.Remove(child);
                child.Dispose();
            }
        }

        private void ShowDays()
        {
            ClearCarousel();
            _carouselContainer.Add(_carouselInner);
            _startIndex = 0;

            float colWidth = 1760f / PAGE_SIZE;

            for (int d = 0; d < _days.Count; d++)
            {
                var day = _days[d];
                var col = CreateDayColumn(day, colWidth);
                _carouselInner.Add(col);
            }

            _carouselInner.Size = new Size(colWidth * _days.Count, 800);
            UpdateCarouselPosition();
            UpdateDots();

            // Focus first activity
            if (_carouselInner.ChildCount > 0)
            {
                var focusTimer = new Timer(200);
                focusTimer.Tick += (s, e) =>
                {
                    var firstCol = _carouselInner.GetChildAt(0);
                    if (firstCol.ChildCount > 1)
                    {
                        var actContainer = firstCol.GetChildAt(1);
                        if (actContainer.ChildCount > 0)
                        {
                            FocusManager.Instance.SetCurrentFocusView(actContainer.GetChildAt(0));
                        }
                    }
                    focusTimer.Stop();
                    focusTimer.Dispose();
                    return false;
                };
                focusTimer.Start();
            }
        }

        private View CreateDayColumn(ItineraryDay day, float width)
        {
            var col = new View
            {
                Size = new Size(width, 800),
                Padding = new Extents(8, 8, 0, 0),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    CellPadding = new Size2D(0, 8)
                }
            };

            // Day header
            col.Add(new TextLabel
            {
                Text = $"Day {day.Day}",
                TextColor = AppColors.White,
                PointSize = 16f,
                FontFamily = "SamsungOneUI",
                Size = new Size(width - 16, 24),
            });

            col.Add(new TextLabel
            {
                Text = day.Date,
                TextColor = AppColors.Indigo300,
                PointSize = 12f,
                FontFamily = "SamsungOneUI",
                Size = new Size(width - 16, 18),
                Margin = new Extents(0, 0, 0, 4),
            });

            // Activities
            var actContainer = new View
            {
                Size = new Size(width - 16, 720),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    CellPadding = new Size2D(0, 10)
                }
            };

            foreach (var act in day.Activities)
            {
                var card = new ActivityCard(act.Time, act.ActivityName, act.Location,
                    act.PhotoUrl, width - 20);
                actContainer.Add(card);
            }

            col.Add(actContainer);
            return col;
        }

        private void UpdateCarouselPosition()
        {
            float colWidth = 1760f / PAGE_SIZE;
            float targetX = -_startIndex * colWidth;
            var anim = new Animation(300);
            anim.AnimateTo(_carouselInner, "PositionX", targetX);
            anim.Play();
        }

        private void UpdateDots()
        {
            while (_dotsContainer.ChildCount > 0)
            {
                var c = _dotsContainer.GetChildAt(0);
                _dotsContainer.Remove(c);
                c.Dispose();
            }

            int totalPages = Math.Max(1, (int)Math.Ceiling((double)_days.Count / PAGE_SIZE));
            int currentPage = _startIndex / PAGE_SIZE;

            for (int i = 0; i < totalPages; i++)
            {
                var dot = new View
                {
                    Size = new Size(10, 10),
                    CornerRadius = 5f,
                    BackgroundColor = i == currentPage ? AppColors.Purple400 : AppColors.White20,
                };
                _dotsContainer.Add(dot);
            }
        }
    }
}
