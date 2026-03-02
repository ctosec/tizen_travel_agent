import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DestinationPage from './pages/DestinationPage';
import ItineraryPage from './pages/ItineraryPage';
import TravelerPage from './pages/TravelerPage';
import BookingPage from './pages/BookingPage';

export default function App() {
  return (
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<DestinationPage />} />
        <Route path="/itinerary" element={<ItineraryPage />} />
        <Route path="/traveler" element={<TravelerPage />} />
        <Route path="/booking" element={<BookingPage />} />
      </Routes>
    </MemoryRouter>
  );
}
