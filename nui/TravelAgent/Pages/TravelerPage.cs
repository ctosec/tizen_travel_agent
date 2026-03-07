using System;
using Tizen.NUI;
using Tizen.NUI.BaseComponents;
using TravelAgent.Components;
using TravelAgent.Models;
using TravelAgent.Utils;

namespace TravelAgent.Pages
{
    public class TravelerPage : View
    {
        private readonly App _app;
        private FocusableInput _lastNameInput;
        private FocusableInput _firstNameInput;
        private FocusableInput _emailInput;
        private FocusableInput _phoneInput;
        private FocusableInput _dobInput;
        private FocusableInput _countryCodeInput;
        private FocusableInput _passportInput;
        private FocusableInput _passportExpiryInput;
        private FocusableInput _nationalityInput;
        private FocusableButton _maleBtn;
        private FocusableButton _femaleBtn;
        private FocusableButton _nextButton;
        private FocusableButton _backButton;
        private TextLabel _errorLabel;
        private string _gender = "";

        public TravelerPage(App app)
        {
            _app = app;
            BackgroundColor = AppColors.Transparent;
            Layout = new AbsoluteLayout();

            var bg = GradientBackground.Create(GradientType.Traveler);
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

            // Header
            main.Add(new TextLabel
            {
                Text = "\uc5ec\ud589\uc790 \uc815\ubcf4",
                TextColor = AppColors.White,
                PointSize = 32f,
                FontFamily = "SamsungOneUI",
                Size = new Size(1760, 40),
                Margin = new Extents(0, 0, 0, 4),
            });
            main.Add(new TextLabel
            {
                Text = "\ud56d\uacf5\ud3b8 \uc608\uc57d\uc5d0 \ud544\uc694\ud55c \uc5ec\ud589\uc790 \uc815\ubcf4\ub97c \uc785\ub825\ud558\uc138\uc694",
                TextColor = AppColors.Purple200,
                PointSize = 15f,
                FontFamily = "SamsungOneUI",
                Size = new Size(1760, 22),
                Margin = new Extents(0, 0, 0, 20),
            });

            // Form grid (3 columns)
            var formGrid = new View
            {
                Size = new Size(1400, 600),
                Layout = new GridLayout
                {
                    Columns = 3,
                    ColumnSpacing = 32f,
                    RowSpacing = 20f,
                }
            };

            float inputWidth = (1400 - 64) / 3f;

            // Row 1
            _lastNameInput = CreateInput("\uc131 (Last Name)", "GILDON", inputWidth);
            _firstNameInput = CreateInput("\uc774\ub984 (First Name)", "joey", inputWidth);
            _emailInput = CreateInput("\uc774\uba54\uc77c", "user@example.com", inputWidth);

            formGrid.Add(_lastNameInput);
            formGrid.Add(_firstNameInput);
            formGrid.Add(_emailInput);

            // Row 2
            _phoneInput = CreateInput("\uc804\ud654\ubc88\ud638", "01012345678", inputWidth, 11);
            _dobInput = CreateInput("\uc0dd\ub144\uc6d4\uc77c (YYYYMMDD)", "19900101", inputWidth, 8);

            // Gender selection
            var genderCol = new View
            {
                Size = new Size(inputWidth, 80),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Vertical,
                    CellPadding = new Size2D(0, 6)
                }
            };
            genderCol.Add(new TextLabel
            {
                Text = "\uc131\ubcc4",
                TextColor = AppColors.Indigo300,
                PointSize = 14f,
                Size = new Size(inputWidth, 20),
            });
            var genderRow = new View
            {
                Size = new Size(inputWidth, 48),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    CellPadding = new Size2D(12, 0)
                }
            };
            _maleBtn = new FocusableButton("\ub0a8\uc131", 100, 44,
                AppColors.White05, AppColors.Indigo300, AppColors.Purple400, 15f, 12f);
            _maleBtn.Clicked += () => SetGender("M");
            _femaleBtn = new FocusableButton("\uc5ec\uc131", 100, 44,
                AppColors.White05, AppColors.Indigo300, AppColors.Purple400, 15f, 12f);
            _femaleBtn.Clicked += () => SetGender("F");
            genderRow.Add(_maleBtn);
            genderRow.Add(_femaleBtn);
            genderCol.Add(genderRow);

            formGrid.Add(_phoneInput);
            formGrid.Add(_dobInput);
            formGrid.Add(genderCol);

            // Row 3
            _countryCodeInput = CreateInput("\uad6d\uac00 \ucf54\ub4dc", "KR", inputWidth, 2);
            _passportInput = CreateInput("\uc5ec\uad8c\ubc88\ud638", "M12345678", inputWidth);
            _passportExpiryInput = CreateInput("\uc5ec\uad8c \ub9cc\ub8cc\uc77c (YYYYMMDD)", "20300101", inputWidth, 8);

            formGrid.Add(_countryCodeInput);
            formGrid.Add(_passportInput);
            formGrid.Add(_passportExpiryInput);

            // Row 4
            _nationalityInput = CreateInput("\uad6d\uc801", "KR", inputWidth, 2);
            formGrid.Add(_nationalityInput);

            main.Add(formGrid);

            // Error label
            _errorLabel = new TextLabel
            {
                Text = "",
                TextColor = AppColors.Amber400,
                PointSize = 13f,
                HorizontalAlignment = HorizontalAlignment.Center,
                Size = new Size(1760, 20),
                Margin = new Extents(0, 0, 8, 0),
            };
            main.Add(_errorLabel);

            // Bottom action bar
            var bottomBar = new View
            {
                Size = new Size(1760, 70),
                Margin = new Extents(0, 0, 8, 0),
                Layout = new LinearLayout
                {
                    LinearOrientation = LinearLayout.Orientation.Horizontal,
                    VerticalAlignment = VerticalAlignment.Center,
                }
            };

            _backButton = new FocusableButton("\uc774\uc804", 160, 50,
                AppColors.White10, AppColors.White, AppColors.White50, 16f, 9999f);
            _backButton.Clicked += () => _app.NavigateTo(App.PageType.Itinerary);
            bottomBar.Add(_backButton);

            var spacer = new View { Size = new Size(1760 - 160 - 280, 70) };
            bottomBar.Add(spacer);

            _nextButton = new FocusableButton(
                "\ud56d\uacf5\ud3b8 & \ud638\ud154 \uc120\ud0dd  \u27a1",
                280, 52,
                fontSize: 18f,
                focusBorderColor: AppColors.Purple400,
                cornerRadius: 9999f
            );
            _nextButton.SetGradientBackground(AppColors.Purple500, AppColors.Pink600);
            _nextButton.Clicked += OnNextClicked;
            bottomBar.Add(_nextButton);
            main.Add(bottomBar);

            Add(main);

            // Restore existing data
            RestoreData();

            // Focus first input
            var focusTimer = new Timer(200);
            focusTimer.Tick += (s, e) =>
            {
                FocusManager.Instance.SetCurrentFocusView(_lastNameInput);
                focusTimer.Stop();
                focusTimer.Dispose();
                return false;
            };
            focusTimer.Start();
        }

        private FocusableInput CreateInput(string label, string placeholder, float width, int maxLength = 100)
        {
            return new FocusableInput(label, placeholder, maxLength, width);
        }

        private void SetGender(string g)
        {
            _gender = g;
            // Visual feedback - update button colors
        }

        private void RestoreData()
        {
            var t = _app.TravelerData;
            if (!string.IsNullOrEmpty(t.LastName)) _lastNameInput.Value = t.LastName;
            if (!string.IsNullOrEmpty(t.FirstName)) _firstNameInput.Value = t.FirstName;
            if (!string.IsNullOrEmpty(t.Email)) _emailInput.Value = t.Email;
            if (!string.IsNullOrEmpty(t.Phone)) _phoneInput.Value = t.Phone;
            if (!string.IsNullOrEmpty(t.DateOfBirth)) _dobInput.Value = t.DateOfBirth;
            if (!string.IsNullOrEmpty(t.Gender)) _gender = t.Gender;
            if (!string.IsNullOrEmpty(t.CountryCode)) _countryCodeInput.Value = t.CountryCode;
            if (!string.IsNullOrEmpty(t.PassportNumber)) _passportInput.Value = t.PassportNumber;
            if (!string.IsNullOrEmpty(t.PassportExpiry)) _passportExpiryInput.Value = t.PassportExpiry;
            if (!string.IsNullOrEmpty(t.Nationality)) _nationalityInput.Value = t.Nationality;
        }

        private void SaveData()
        {
            _app.TravelerData = new TravelerData
            {
                LastName = _lastNameInput.Value,
                FirstName = _firstNameInput.Value,
                Email = _emailInput.Value,
                Phone = _phoneInput.Value,
                DateOfBirth = _dobInput.Value,
                Gender = _gender,
                CountryCode = _countryCodeInput.Value,
                PassportNumber = _passportInput.Value,
                PassportExpiry = _passportExpiryInput.Value,
                Nationality = _nationalityInput.Value,
            };
        }

        private void OnNextClicked()
        {
            SaveData();
            if (!_app.TravelerData.IsValid)
            {
                _errorLabel.Text = "\uc131, \uc774\ub984, \uc774\uba54\uc77c, \uc804\ud654\ubc88\ud638\ub294 \ud544\uc218 \ud56d\ubaa9\uc785\ub2c8\ub2e4";
                return;
            }
            _app.NavigateTo(App.PageType.Booking);
        }
    }
}
