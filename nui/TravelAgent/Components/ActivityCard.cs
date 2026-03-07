using System;
using Tizen.NUI;
using Tizen.NUI.BaseComponents;

namespace TravelAgent.Components
{
    public class ActivityCard : View
    {
        private readonly View _cardView;
        private Animation _scaleAnim;

        public ActivityCard(string time, string activity, string location,
            string photoUrl, float cardWidth = 340f)
        {
            Focusable = true;
            bool hasPhoto = !string.IsNullOrEmpty(photoUrl);
            float cardHeight = hasPhoto ? 220f : 85f;
            Size = new Size(cardWidth, cardHeight);

            _cardView = new View
            {
                Size = new Size(cardWidth, cardHeight),
                CornerRadius = 12f,
                BackgroundColor = Utils.AppColors.White05,
                BorderlineWidth = 1f,
                BorderlineColor = Utils.AppColors.White10,
                ClippingMode = ClippingModeType.ClipToBoundingBox,
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                }
            };

            // Photo
            if (hasPhoto)
            {
                var img = new ImageView
                {
                    Size = new Size(cardWidth, 120),
                    ResourceUrl = photoUrl,
                    DesiredWidth = (int)cardWidth,
                    DesiredHeight = 120,
                };
                _cardView.Add(img);
            }

            // Content
            var content = new View
            {
                Padding = new Extents(12, 12, 8, 8),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    CellPadding = new Size2D(0, 4)
                }
            };

            // Time badge
            var timeBadge = new TextLabel
            {
                Text = time,
                TextColor = Utils.AppColors.Purple300,
                PointSize = 11f,
                FontFamily = "SamsungOneUI",
                BackgroundColor = new Color(168 / 255f, 85 / 255f, 247 / 255f, 0.2f),
                Padding = new Extents(8, 8, 2, 2),
                Size = new Size(cardWidth - 24, 18),
            };
            content.Add(timeBadge);

            // Activity name
            var actLabel = new TextLabel
            {
                Text = activity,
                TextColor = Utils.AppColors.White,
                PointSize = 13f,
                FontFamily = "SamsungOneUI",
                MultiLine = true,
                Ellipsis = true,
                Size = new Size(cardWidth - 24, 36),
            };
            content.Add(actLabel);

            // Location
            var locLabel = new TextLabel
            {
                Text = location,
                TextColor = Utils.AppColors.Indigo300,
                PointSize = 11f,
                FontFamily = "SamsungOneUI",
                Ellipsis = true,
                Size = new Size(cardWidth - 24, 16),
            };
            content.Add(locLabel);

            _cardView.Add(content);
            Add(_cardView);

            FocusGained += OnFocusGained;
            FocusLost += OnFocusLost;
        }

        private void AnimateScale(Vector3 target)
        {
            _scaleAnim?.Stop();
            _scaleAnim?.Dispose();
            _scaleAnim = new Animation(100);
            _scaleAnim.AnimateTo(this, "Scale", target);
            _scaleAnim.Play();
        }

        private void OnFocusGained(object sender, EventArgs e)
        {
            AnimateScale(new Vector3(1.05f, 1.05f, 1f));
        }

        private void OnFocusLost(object sender, EventArgs e)
        {
            AnimateScale(new Vector3(1f, 1f, 1f));
        }
    }
}
