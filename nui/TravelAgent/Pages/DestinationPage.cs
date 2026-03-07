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
    public class DestinationPage : View
    {
        private readonly App _app;
        private View _cardsContainer;
        private TextLabel _titleLabel;
        private TextLabel _subtitleLabel;
        private View _contentArea;
        private LoadingSpinner _spinner;
        private FocusableButton _ctaButton;
        private List<AttractionCard> _cards = new();

        public DestinationPage(App app)
        {
            _app = app;
            BackgroundColor = AppColors.Transparent;
            Layout = new AbsoluteLayout();

            // Gradient background
            var bg = GradientBackground.Create(GradientType.Destination);
            Add(bg);

            // Main content
            var main = new View
            {
                Size = new Size(1920, 1080),
                Padding = new Extents(80, 80, 80, 80),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                }
            };

            // Header
            _titleLabel = new TextLabel
            {
                Text = app.City,
                TextColor = AppColors.White,
                PointSize = 60f,
                FontFamily = "SamsungOneUI",
                Size = new Size(1760, 80),
                Margin = new Extents(0, 0, 0, 12),
            };
            main.Add(_titleLabel);

            _subtitleLabel = new TextLabel
            {
                Text = $"{app.Country}\uc758 \ub9e4\ub825\uc801\uc778 \ub3c4\uc2dc, {app.City}\ub97c \ud0d0\ud5d8\ud574\ubcf4\uc138\uc694",
                TextColor = AppColors.Blue200,
                PointSize = 22f,
                FontFamily = "SamsungOneUI",
                Size = new Size(1760, 32),
                Margin = new Extents(0, 0, 0, 24),
            };
            main.Add(_subtitleLabel);

            // Cards container (center area)
            _contentArea = new View
            {
                Size = new Size(1760, 680),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                    CellPadding = new Size2D(24, 0)
                }
            };
            main.Add(_contentArea);

            // CTA button row
            var ctaRow = new View
            {
                Size = new Size(1760, 80),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    HorizontalAlignment = HorizontalAlignment.End,
                    VerticalAlignment = VerticalAlignment.Center,
                }
            };

            _ctaButton = new FocusableButton(
                "Make a Trip  \u27a1",
                280, 60,
                focusBorderColor: AppColors.Purple400,
                fontSize: 22f,
                cornerRadius: 9999f
            );
            _ctaButton.SetGradientBackground(AppColors.Blue500, AppColors.Purple600);
            _ctaButton.Clicked += () => _app.NavigateTo(App.PageType.Itinerary);
            ctaRow.Add(_ctaButton);
            main.Add(ctaRow);

            Add(main);

            // Show loading and fetch data
            ShowLoading();
            _ = LoadDataAsync();
        }

        private void ShowLoading()
        {
            _spinner = new LoadingSpinner("\uad00\uad11\uc9c0 \uc815\ubcf4\ub97c \ubd88\ub7ec\uc624\ub294 \uc911...");
            _spinner.Size = new Size(1760, 680);
            _contentArea.Add(_spinner);
        }

        private async Task LoadDataAsync()
        {
            try
            {
                var data = await DestinationService.GetDestination(_app.Country, _app.City);
                ShowAttractions(data.Attractions);
            }
            catch (Exception)
            {
                ShowAttractions(new List<Attraction>());
            }
        }

        private void ShowAttractions(List<Attraction> attractions)
        {
            if (_spinner != null)
            {
                _spinner.Stop();
                _contentArea.Remove(_spinner);
                _spinner.Dispose();
                _spinner = null;
            }

            if (attractions.Count == 0)
            {
                var empty = new TextLabel
                {
                    Text = "\uad00\uad11\uc9c0 \uc815\ubcf4\ub97c \ubd88\ub7ec\uc62c \uc218 \uc5c6\uc2b5\ub2c8\ub2e4",
                    TextColor = AppColors.Indigo300,
                    PointSize = 20f,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                    Size = new Size(1760, 680),
                };
                _contentArea.Add(empty);
                return;
            }

            for (int i = 0; i < Math.Min(attractions.Count, 5); i++)
            {
                var a = attractions[i];
                var card = new AttractionCard(a.Name, a.Description, a.PhotoUrl, a.Rating, i);
                _cards.Add(card);
                _contentArea.Add(card);
            }

            // Focus first card
            if (_cards.Count > 0)
            {
                var timer = new Timer(200);
                timer.Tick += (s, e) =>
                {
                    FocusManager.Instance.SetCurrentFocusView(_cards[0]);
                    timer.Stop();
                    timer.Dispose();
                    return false;
                };
                timer.Start();
            }
        }
    }
}
