using Tizen.NUI;
using Tizen.NUI.BaseComponents;

namespace TravelAgent.Components
{
    public class LoadingSpinner : View
    {
        private readonly View _spinner;
        private Animation _spinAnimation;

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

            // Spinner circle
            _spinner = new View
            {
                Size = new Size(size, size),
                CornerRadius = size / 2f,
                BorderlineWidth = 4f,
                BorderlineColor = Utils.AppColors.White10,
                BackgroundColor = Utils.AppColors.Transparent,
            };

            // Blue top arc (simulated with a partial border - using a visual)
            var arcMap = new PropertyMap();
            arcMap.Insert(Visual.Property.Type, new PropertyValue((int)Visual.Type.Border));
            arcMap.Insert(BorderVisualProperty.Color, new PropertyValue(Utils.AppColors.Blue400));
            arcMap.Insert(BorderVisualProperty.Size, new PropertyValue(4f));
            arcMap.Insert(Visual.Property.CornerRadius, new PropertyValue(size / 2f));
            _spinner.Background = arcMap;

            Add(_spinner);

            var label = new TextLabel
            {
                Text = text,
                TextColor = Utils.AppColors.Indigo200,
                PointSize = 20f,
                FontFamily = "SamsungOneUI",
                HorizontalAlignment = HorizontalAlignment.Center,
            };
            Add(label);

            StartSpin();
        }

        private void StartSpin()
        {
            _spinAnimation = new Animation(1000);
            _spinAnimation.AnimateTo(_spinner, "Orientation",
                new Rotation(new Radian(new Degree(360)), Vector3.ZAxis));
            _spinAnimation.Looping = true;
            _spinAnimation.Play();
        }

        public void Stop()
        {
            _spinAnimation?.Stop();
        }
    }
}
