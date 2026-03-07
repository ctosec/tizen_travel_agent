using System;
using Tizen.NUI;
using Tizen.NUI.BaseComponents;

namespace TravelAgent.Components
{
    public class AttractionCard : View
    {
        private readonly View _cardView;
        private readonly ImageView _imageView;
        private readonly TextLabel _nameLabel;
        private readonly TextLabel _ratingLabel;
        private readonly TextLabel _descLabel;
        private Animation _scaleAnim;

        public AttractionCard(string name, string description, string photoUrl,
            double? rating, int index)
        {
            Focusable = true;
            Size = new Size(320, 580);

            _cardView = new View
            {
                Size = new Size(320, 580),
                CornerRadius = 16f,
                BackgroundColor = Utils.AppColors.White,
                ClippingMode = ClippingModeType.ClipToBoundingBox,
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                }
            };

            // Image area
            _imageView = new ImageView
            {
                Size = new Size(320, 340),
                ResourceUrl = string.IsNullOrEmpty(photoUrl) ? "" : photoUrl,
                DesiredWidth = 320,
                DesiredHeight = 340,
            };
            if (string.IsNullOrEmpty(photoUrl))
            {
                _imageView.BackgroundColor = Utils.AppColors.Slate200;
            }
            _cardView.Add(_imageView);

            // Content area
            var content = new View
            {
                Size = new Size(320, 240),
                Padding = new Extents(20, 20, 16, 16),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    CellPadding = new Size2D(0, 6)
                }
            };

            _nameLabel = new TextLabel
            {
                Text = name,
                TextColor = Utils.AppColors.Slate800,
                PointSize = 20f,
                FontFamily = "SamsungOneUI",
                Ellipsis = true,
                Size = new Size(280, 28),
            };
            content.Add(_nameLabel);

            if (rating.HasValue)
            {
                _ratingLabel = new TextLabel
                {
                    Text = $"\u2b50 {rating:F1}",
                    TextColor = Utils.AppColors.Amber500,
                    PointSize = 14f,
                    FontFamily = "SamsungOneUI",
                    Size = new Size(280, 20),
                };
                content.Add(_ratingLabel);
            }

            _descLabel = new TextLabel
            {
                Text = description,
                TextColor = Utils.AppColors.Gray600,
                PointSize = 14f,
                FontFamily = "SamsungOneUI",
                MultiLine = true,
                Ellipsis = true,
                Size = new Size(280, 150),
            };
            content.Add(_descLabel);

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
            AnimateScale(new Vector3(1.08f, 1.08f, 1f));
        }

        private void OnFocusLost(object sender, EventArgs e)
        {
            AnimateScale(new Vector3(1f, 1f, 1f));
        }
    }
}
