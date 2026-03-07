using System;
using Tizen.NUI;
using Tizen.NUI.BaseComponents;

namespace TravelAgent.Components
{
    public class FocusableButton : View
    {
        private readonly View _inner;
        private readonly TextLabel _label;
        private bool _isFocused;
        private bool _disabled;
        private Color _bgColor;
        private Color _focusBorderColor;
        private float _cornerRadius;

        public event Action Clicked;

        public FocusableButton(string text, float width, float height,
            Color bgColor = null, Color textColor = null, Color focusBorderColor = null,
            float fontSize = 20f, float cornerRadius = 9999f)
        {
            Focusable = true;
            Size = new Size(width, height);
            _bgColor = bgColor ?? Utils.AppColors.Purple500;
            _focusBorderColor = focusBorderColor ?? Utils.AppColors.Purple400;
            _cornerRadius = cornerRadius;

            _inner = new View
            {
                Size = new Size(width, height),
                CornerRadius = cornerRadius,
                BackgroundColor = _bgColor,
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    VerticalAlignment = VerticalAlignment.Center,
                    CellPadding = new Size2D(8, 0)
                }
            };

            _label = new TextLabel
            {
                Text = text,
                TextColor = textColor ?? Utils.AppColors.White,
                PointSize = fontSize,
                HorizontalAlignment = HorizontalAlignment.Center,
                VerticalAlignment = VerticalAlignment.Center,
                FontFamily = "SamsungOneUI",
            };
            _inner.Add(_label);
            Add(_inner);

            FocusGained += OnFocusGained;
            FocusLost += OnFocusLost;
            KeyEvent += OnKeyEvent;
        }

        public string Text
        {
            get => _label.Text;
            set => _label.Text = value;
        }

        public bool Disabled
        {
            get => _disabled;
            set
            {
                _disabled = value;
                _inner.Opacity = value ? 0.5f : 1.0f;
            }
        }

        public void SetGradientBackground(Color from, Color to)
        {
            var gradMap = new PropertyMap();
            gradMap.Insert(Visual.Property.Type, new PropertyValue((int)Visual.Type.Gradient));
            gradMap.Insert(GradientVisualProperty.StartPosition, new PropertyValue(new Vector2(-0.5f, 0f)));
            gradMap.Insert(GradientVisualProperty.EndPosition, new PropertyValue(new Vector2(0.5f, 0f)));

            var stops = new PropertyArray();
            stops.PushBack(new PropertyValue(0.0f));
            stops.PushBack(new PropertyValue(1.0f));
            var colors = new PropertyArray();
            colors.PushBack(new PropertyValue(from));
            colors.PushBack(new PropertyValue(to));

            gradMap.Insert(GradientVisualProperty.StopOffset, new PropertyValue(stops));
            gradMap.Insert(GradientVisualProperty.StopColor, new PropertyValue(colors));
            gradMap.Insert(Visual.Property.CornerRadius, new PropertyValue(_cornerRadius));

            _inner.Background = gradMap;
        }

        private void OnFocusGained(object sender, EventArgs e)
        {
            if (_disabled) return;
            _isFocused = true;
            _inner.BorderlineWidth = 3f;
            _inner.BorderlineColor = _focusBorderColor;
            _inner.BorderlineOffset = 1f;
        }

        private void OnFocusLost(object sender, EventArgs e)
        {
            _isFocused = false;
            _inner.BorderlineWidth = 0f;
        }

        private bool OnKeyEvent(object sender, KeyEventArgs e)
        {
            if (e.Key.State == Key.StateType.Down &&
                (e.Key.KeyPressedName == "Return" || e.Key.KeyPressedName == "Enter"))
            {
                if (!_disabled)
                    Clicked?.Invoke();
                return true;
            }
            return false;
        }
    }
}
