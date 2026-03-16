using Tizen.NUI;
using Tizen.NUI.BaseComponents;

namespace TravelAgent.Components
{
    public class LoadingSpinner : View
    {
        private readonly View[] _dots = new View[3];
        private Animation _animation;

        public LoadingSpinner(string text = "\ub85c\ub529\uc911...", float size = 48f)
        {
            Size = new Size(1920, 1080);
            Layout = new LinearLayout
            {
                LinearOrientation = LinearLayout.Orientation.Vertical,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center,
                CellPadding = new Size2D(0, 20)
            };

            // Dots container
            var dotsRow = new View
            {
                Size = new Size(size * 2, size / 2),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                    CellPadding = new Size2D(12, 0)
                }
            };

            float dotSize = size / 4f;
            for (int i = 0; i < 3; i++)
            {
                _dots[i] = new View
                {
                    Size = new Size(dotSize, dotSize),
                    CornerRadius = dotSize / 2f,
                    BackgroundColor = Utils.AppColors.Blue400,
                    Opacity = 0.3f,
                };
                dotsRow.Add(_dots[i]);
            }

            Add(dotsRow);

            var label = new TextLabel
            {
                Text = text,
                TextColor = Utils.AppColors.Indigo200,
                PointSize = 20f,
                FontFamily = "SamsungOneUI",
                HorizontalAlignment = HorizontalAlignment.Center,
            };
            Add(label);

            StartAnimation();
        }

        private void StartAnimation()
        {
            _animation = new Animation(1200);

            for (int i = 0; i < 3; i++)
            {
                int offset = i * 200; // stagger each dot by 200ms

                // Fade in + scale up
                _animation.AnimateTo(_dots[i], "Opacity", 1.0f, offset, offset + 300);
                _animation.AnimateTo(_dots[i], "ScaleX", 1.3f, offset, offset + 300);
                _animation.AnimateTo(_dots[i], "ScaleY", 1.3f, offset, offset + 300);

                // Fade out + scale down
                _animation.AnimateTo(_dots[i], "Opacity", 0.3f, offset + 300, offset + 600);
                _animation.AnimateTo(_dots[i], "ScaleX", 1.0f, offset + 300, offset + 600);
                _animation.AnimateTo(_dots[i], "ScaleY", 1.0f, offset + 300, offset + 600);
            }

            _animation.Looping = true;
            _animation.Play();
        }

        public void Stop()
        {
            _animation?.Stop();
        }
    }
}
