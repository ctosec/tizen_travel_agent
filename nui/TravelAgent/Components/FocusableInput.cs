using System;
using Tizen.NUI;
using Tizen.NUI.BaseComponents;

namespace TravelAgent.Components
{
    public class FocusableInput : View
    {
        private readonly TextLabel _labelView;
        private readonly TextField _field;
        private bool _editing;
        private Color _defaultBorderColor = Utils.AppColors.White20;
        private Color _focusBorderColor = Utils.AppColors.Purple400;
        private Color _editBorderColor = Utils.AppColors.Amber400;

        public event Action<string> ValueChanged;

        public FocusableInput(string label, string placeholder = "", int maxLength = 100,
            float width = 400f, float labelFontSize = 14f)
        {
            Focusable = true;
            Size = new Size(width, 80);
            Layout = new LinearLayout
            {
                LinearOrientation = LinearLayout.Orientation.Vertical,
                CellPadding = new Size2D(0, 6)
            };

            _labelView = new TextLabel
            {
                Text = label,
                TextColor = Utils.AppColors.Indigo300,
                PointSize = labelFontSize,
                FontFamily = "SamsungOneUI",
                Size = new Size(width, 20),
            };
            Add(_labelView);

            _field = new TextField
            {
                Size = new Size(width, 52),
                CornerRadius = 12f,
                BackgroundColor = Utils.AppColors.White05,
                BorderlineWidth = 2f,
                BorderlineColor = _defaultBorderColor,
                TextColor = Utils.AppColors.White,
                PlaceholderTextColor = Utils.AppColors.White30,
                PlaceholderText = placeholder,
                PointSize = 18f,
                FontFamily = "SamsungOneUI",
                Padding = new Extents(16, 16, 0, 0),
                MaxLength = maxLength,
                EnableSelection = false,
            };

            _field.TextChanged += (s, e) =>
            {
                ValueChanged?.Invoke(_field.Text);
            };

            Add(_field);

            FocusGained += OnFocusGained;
            FocusLost += OnFocusLost;
            KeyEvent += OnKeyEvent;
        }

        public string Value
        {
            get => _field.Text;
            set => _field.Text = value;
        }

        public string Label
        {
            get => _labelView.Text;
            set => _labelView.Text = value;
        }

        private void OnFocusGained(object sender, EventArgs e)
        {
            _field.BorderlineColor = _focusBorderColor;
            _field.BorderlineWidth = 2f;
        }

        private void OnFocusLost(object sender, EventArgs e)
        {
            _editing = false;
            _field.BorderlineColor = _defaultBorderColor;
            _field.BorderlineWidth = 2f;
        }

        private bool OnKeyEvent(object sender, KeyEventArgs e)
        {
            if (e.Key.State != Key.StateType.Down) return false;

            var keyName = e.Key.KeyPressedName;

            if (keyName == "Return" || keyName == "Enter")
            {
                if (!_editing)
                {
                    _editing = true;
                    _field.BorderlineColor = _editBorderColor;
                    FocusManager.Instance.SetCurrentFocusView(_field);
                    return true;
                }
                else
                {
                    _editing = false;
                    _field.BorderlineColor = _focusBorderColor;
                    FocusManager.Instance.SetCurrentFocusView(this);
                    return true;
                }
            }

            if (_editing && keyName == "Escape")
            {
                _editing = false;
                _field.BorderlineColor = _focusBorderColor;
                FocusManager.Instance.SetCurrentFocusView(this);
                return true;
            }

            return false;
        }
    }
}
