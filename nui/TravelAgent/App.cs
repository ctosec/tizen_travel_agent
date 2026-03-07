using System;
using Tizen.NUI;
using Tizen.NUI.BaseComponents;
using TravelAgent.Pages;
using TravelAgent.Services;

namespace TravelAgent
{
    public class App : NUIApplication
    {
        private View _rootView;
        private View _currentPage;
        private string _city = "Barcelona";
        private string _country = "Spain";

        protected override void OnCreate()
        {
            base.OnCreate();

            var win = Window.Instance;
            win.BackgroundColor = Utils.AppColors.Slate900;
            win.KeyEvent += OnKeyEvent;

            _rootView = new View
            {
                Size = new Size(1920, 1080),
                Layout = new AbsoluteLayout()
            };
            win.Add(_rootView);

            NavigateTo(PageType.Destination);
        }

        public enum PageType
        {
            Destination,
            Itinerary,
            Traveler,
            Booking
        }

        public string City => _city;
        public string Country => _country;
        public string AirportCode => Utils.AirportCodes.GetCode(_city);

        public void SetDestination(string city, string country)
        {
            _city = city;
            _country = country;
        }

        public void NavigateTo(PageType page)
        {
            if (_currentPage != null)
            {
                _rootView.Remove(_currentPage);
                _currentPage.Dispose();
                _currentPage = null;
            }

            View newPage = page switch
            {
                PageType.Destination => new DestinationPage(this),
                PageType.Itinerary => new ItineraryPage(this),
                PageType.Traveler => new TravelerPage(this),
                PageType.Booking => new BookingPage(this),
                _ => new DestinationPage(this)
            };

            newPage.Size = new Size(1920, 1080);
            _currentPage = newPage;
            _rootView.Add(_currentPage);
        }

        public void GoBack()
        {
            if (_currentPage is BookingPage)
                NavigateTo(PageType.Traveler);
            else if (_currentPage is TravelerPage)
                NavigateTo(PageType.Itinerary);
            else if (_currentPage is ItineraryPage)
                NavigateTo(PageType.Destination);
        }

        private void OnKeyEvent(object sender, Window.KeyEventArgs e)
        {
            if (e.Key.State != Key.StateType.Down) return;

            if (e.Key.KeyPressedName == "Escape" || e.Key.KeyPressedName == "XF86Back")
            {
                if (_currentPage is DestinationPage)
                    Exit();
                else
                    GoBack();
            }
        }

        // Shared state
        public Models.TravelerData TravelerData { get; set; } = new();
        public System.Collections.Generic.List<Models.ItineraryDay> ItineraryDays { get; set; } = new();
        public int Duration { get; set; } = 5;
        public string StartDate { get; set; } = DateTime.Now.AddDays(14).ToString("yyyy-MM-dd");
        public Models.FlightOffer SelectedFlight { get; set; }
        public Models.HotelOffer SelectedHotel { get; set; }
    }
}
