using Tizen.NUI;
using Tizen.NUI.BaseComponents;

namespace TravelAgent.Components
{
    public enum GradientType
    {
        Destination,  // slate-900 → blue-900 → slate-900
        Itinerary,    // slate-900 → purple-900 → slate-900
        Traveler,     // slate-900 → purple-900 → slate-900
        Booking       // slate-900 → indigo-900 → slate-900
    }

    public static class GradientBackground
    {
        public static View Create(GradientType type)
        {
            var bg = new View
            {
                Size = new Size(1920, 1080),
                Position = new Position(0, 0),
            };

            // NUI supports visual gradients
            var gradientMap = new PropertyMap();
            gradientMap.Insert(Visual.Property.Type, new PropertyValue((int)Visual.Type.Gradient));

            var startPos = new PropertyValue(new Vector2(-0.5f, -0.5f));
            var endPos = new PropertyValue(new Vector2(0.5f, 0.5f));
            gradientMap.Insert(GradientVisualProperty.StartPosition, startPos);
            gradientMap.Insert(GradientVisualProperty.EndPosition, endPos);

            var stops = new PropertyArray();
            var colors = new PropertyArray();

            Color midColor = type switch
            {
                GradientType.Destination => Utils.AppColors.Blue900,
                GradientType.Itinerary => Utils.AppColors.Purple900,
                GradientType.Traveler => Utils.AppColors.Purple900,
                GradientType.Booking => Utils.AppColors.Indigo900,
                _ => Utils.AppColors.Blue900
            };

            stops.PushBack(new PropertyValue(0.0f));
            stops.PushBack(new PropertyValue(0.5f));
            stops.PushBack(new PropertyValue(1.0f));

            colors.PushBack(new PropertyValue(Utils.AppColors.Slate900));
            colors.PushBack(new PropertyValue(midColor));
            colors.PushBack(new PropertyValue(Utils.AppColors.Slate900));

            gradientMap.Insert(GradientVisualProperty.StopOffset, new PropertyValue(stops));
            gradientMap.Insert(GradientVisualProperty.StopColor, new PropertyValue(colors));

            bg.Background = gradientMap;
            return bg;
        }
    }
}
