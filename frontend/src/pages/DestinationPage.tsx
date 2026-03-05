import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FocusContext, useFocusable, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useDestinationStore } from '../stores/destinationStore';
import { useTravelConfigStore } from '../stores/travelConfigStore';
import AttractionCard from '../components/AttractionCard';
import FocusableButton from '../components/FocusableButton';
import LoadingSpinner from '../components/LoadingSpinner';

export default function DestinationPage() {
  const navigate = useNavigate();
  const { city, country } = useTravelConfigStore();
  const { data, loading, fetchDestination } = useDestinationStore();
  const { ref, focusKey } = useFocusable({
    isFocusBoundary: true,
  });

  useEffect(() => {
    if (!data) {
      fetchDestination(country, city);
    }
  }, [data, fetchDestination, country, city]);

  // Set initial focus when attractions load
  useEffect(() => {
    if (data?.attractions?.length) {
      const timer = setTimeout(() => setFocus('attraction-0'), 100);
      return () => clearTimeout(timer);
    }
  }, [data]);

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="w-[1920px] h-[1080px] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col overflow-hidden p-[80px]"
      >
        {/* Header */}
        <div>
          <h1 className="text-7xl text-white mb-4">{data?.city || city}</h1>
          <p className="text-2xl text-blue-200">
            {country}의 매력적인 도시, {data?.city || city}를 탐험해보세요
          </p>
        </div>

        {/* Attraction Cards */}
        <div className="flex-1 flex items-center justify-center">
          {loading ? (
            <LoadingSpinner text="관광지 정보를 불러오는 중..." />
          ) : (
            <div className="flex gap-6 items-center justify-center">
              {(data?.attractions || []).map((attraction, index) => (
                <AttractionCard
                  key={index}
                  name={attraction.name}
                  description={attraction.description}
                  photoUrl={attraction.photoUrl}
                  rating={attraction.rating}
                  focusKey={`attraction-${index}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Make a Trip Button */}
        <div className="flex justify-end">
          <FocusableButton
            focusKey="make-trip-btn"
            onClick={() => navigate('/itinerary')}
            className="group rounded-full"
            focusedClassName="ring-4 ring-purple-400 scale-105 shadow-purple-500/50"
          >
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-16 py-6 rounded-full text-2xl shadow-2xl transition-all duration-300 flex items-center gap-5">
              Make a Trip
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </FocusableButton>
        </div>
      </div>
    </FocusContext.Provider>
  );
}
