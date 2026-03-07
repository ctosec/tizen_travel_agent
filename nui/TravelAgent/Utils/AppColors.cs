using Tizen.NUI;

namespace TravelAgent.Utils
{
    public static class AppColors
    {
        // Slate
        public static readonly Color Slate900 = new Color(15 / 255f, 23 / 255f, 42 / 255f, 1f);
        public static readonly Color Slate800 = new Color(30 / 255f, 41 / 255f, 59 / 255f, 1f);
        public static readonly Color Slate200 = new Color(226 / 255f, 232 / 255f, 240 / 255f, 1f);

        // Blue
        public static readonly Color Blue900 = new Color(17 / 255f, 30 / 255f, 63 / 255f, 1f);
        public static readonly Color Blue500 = new Color(59 / 255f, 130 / 255f, 246 / 255f, 1f);
        public static readonly Color Blue400 = new Color(96 / 255f, 165 / 255f, 250 / 255f, 1f);
        public static readonly Color Blue200 = new Color(191 / 255f, 219 / 255f, 254 / 255f, 1f);

        // Purple
        public static readonly Color Purple900 = new Color(45 / 255f, 27 / 255f, 78 / 255f, 1f);
        public static readonly Color Purple600 = new Color(147 / 255f, 51 / 255f, 234 / 255f, 1f);
        public static readonly Color Purple500 = new Color(168 / 255f, 85 / 255f, 247 / 255f, 1f);
        public static readonly Color Purple400 = new Color(192 / 255f, 132 / 255f, 252 / 255f, 1f);
        public static readonly Color Purple300 = new Color(216 / 255f, 180 / 255f, 254 / 255f, 1f);
        public static readonly Color Purple200 = new Color(233 / 255f, 213 / 255f, 255 / 255f, 1f);

        // Pink
        public static readonly Color Pink600 = new Color(219 / 255f, 39 / 255f, 119 / 255f, 1f);

        // Indigo
        public static readonly Color Indigo900 = new Color(49 / 255f, 46 / 255f, 129 / 255f, 1f);
        public static readonly Color Indigo300 = new Color(165 / 255f, 180 / 255f, 252 / 255f, 1f);
        public static readonly Color Indigo200 = new Color(199 / 255f, 210 / 255f, 254 / 255f, 1f);

        // Emerald
        public static readonly Color Emerald500 = new Color(16 / 255f, 185 / 255f, 129 / 255f, 1f);
        public static readonly Color Emerald400 = new Color(52 / 255f, 211 / 255f, 153 / 255f, 1f);

        // Amber
        public static readonly Color Amber400 = new Color(251 / 255f, 191 / 255f, 36 / 255f, 1f);
        public static readonly Color Amber500 = new Color(245 / 255f, 158 / 255f, 11 / 255f, 1f);

        // Red
        public static readonly Color Red400 = new Color(248 / 255f, 113 / 255f, 113 / 255f, 1f);

        // White variations
        public static readonly Color White = new Color(1f, 1f, 1f, 1f);
        public static readonly Color White05 = new Color(1f, 1f, 1f, 0.05f);
        public static readonly Color White10 = new Color(1f, 1f, 1f, 0.10f);
        public static readonly Color White20 = new Color(1f, 1f, 1f, 0.20f);
        public static readonly Color White30 = new Color(1f, 1f, 1f, 0.30f);
        public static readonly Color White50 = new Color(1f, 1f, 1f, 0.50f);

        // Gray
        public static readonly Color Gray600 = new Color(75 / 255f, 85 / 255f, 99 / 255f, 1f);
        public static readonly Color Gray400 = new Color(156 / 255f, 163 / 255f, 175 / 255f, 1f);

        // Transparent
        public static readonly Color Transparent = new Color(0f, 0f, 0f, 0f);

        // Page-specific background blends (approximated solid colors for gradient center)
        public static readonly Color DestinationBg = new Color(13 / 255f, 25 / 255f, 52 / 255f, 1f);
        public static readonly Color ItineraryBg = new Color(27 / 255f, 20 / 255f, 55 / 255f, 1f);
        public static readonly Color TravelerBg = new Color(27 / 255f, 20 / 255f, 55 / 255f, 1f);
        public static readonly Color BookingBg = new Color(22 / 255f, 22 / 255f, 72 / 255f, 1f);

        // Functional aliases
        public static readonly Color CardBg = White05;
        public static readonly Color BorderDefault = White10;
        public static readonly Color BorderLight = White20;
    }
}
