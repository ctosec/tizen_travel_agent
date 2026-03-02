import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FocusContext, useFocusable, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useItineraryStore } from '../stores/itineraryStore';
import ItineraryDayColumn from '../components/ItineraryDayColumn';
import FocusableButton from '../components/FocusableButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTVKeys } from '../hooks/useTVKeys';

const COUNTRY = 'Spain';
const CITY = 'Barcelona';
const PAGE_SIZE = 5;

export default function ItineraryPage() {
  const navigate = useNavigate();
  const { days, loading, startDate, duration, setStartDate, setDuration, generateItinerary } =
    useItineraryStore();
  const { ref, focusKey } = useFocusable({
    isFocusBoundary: true,
  });
  const [startIndex, setStartIndex] = useState(0);

  useTVKeys({ onBack: () => navigate('/') });

  useEffect(() => {
    if (days.length === 0 && !loading) {
      generateItinerary(COUNTRY, CITY);
    }
  }, [days.length, loading, generateItinerary]);

  // Reset paging when days change (regeneration)
  useEffect(() => {
    setStartIndex(0);
  }, [days.length]);

  // Set initial focus when days load
  useEffect(() => {
    if (days.length > 0 && !loading) {
      const timer = setTimeout(() => setFocus('day-col-' + days[0].day), 100);
      return () => clearTimeout(timer);
    }
  }, [days, loading]);

  const handleDateChange = useCallback(
    (delta: number) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + delta);
      setStartDate(d.toISOString().split('T')[0]);
    },
    [startDate, setStartDate],
  );

  const handleRegenerate = useCallback(() => {
    generateItinerary(COUNTRY, CITY);
  }, [generateItinerary]);

  const visibleDays = days.slice(startIndex, startIndex + PAGE_SIZE);
  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex + PAGE_SIZE < days.length;

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="w-[1920px] h-[1080px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="pt-6 px-16 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-4xl text-white mb-1">여행 일정</h1>
            <p className="text-base text-purple-200">
              {CITY}, {COUNTRY} — AI가 생성한 맞춤 일정
            </p>
          </div>
          {/* Date & Duration Controls */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2.5">
              <FocusableButton
                focusKey="date-prev"
                onClick={() => handleDateChange(-1)}
                className="rounded-full"
              focusedClassName="ring-2 ring-purple-400"
              >
                <button className="text-white text-xl px-2">◀</button>
              </FocusableButton>
              <span className="text-white text-lg min-w-[140px] text-center">{startDate}</span>
              <FocusableButton
                focusKey="date-next"
                onClick={() => handleDateChange(1)}
                className="rounded-full"
                focusedClassName="ring-2 ring-purple-400"
              >
                <button className="text-white text-xl px-2">▶</button>
              </FocusableButton>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2.5">
              <FocusableButton
                focusKey="dur-down"
                onClick={() => setDuration(duration - 1)}
                className="rounded-full"
                focusedClassName="ring-2 ring-purple-400"
              >
                <button className="text-white text-xl px-2">◀</button>
              </FocusableButton>
              <span className="text-white text-lg min-w-[80px] text-center">{duration}일</span>
              <FocusableButton
                focusKey="dur-up"
                onClick={() => setDuration(duration + 1)}
                className="rounded-full"
                focusedClassName="ring-2 ring-purple-400"
              >
                <button className="text-white text-xl px-2">▶</button>
              </FocusableButton>
            </div>
            <FocusableButton
              focusKey="regenerate-btn"
              onClick={handleRegenerate}
              className="rounded-full"
              focusedClassName="ring-2 ring-purple-400 scale-105"
            >
              <button className="bg-purple-500/20 border border-purple-400/30 text-purple-200 px-6 py-2.5 rounded-full text-lg hover:bg-purple-500/30 transition-all">
                일정 재생성
              </button>
            </FocusableButton>
          </div>
        </div>

        {/* Day Columns with scroll arrows */}
        <div className="flex-1 px-16 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner text="AI가 일정을 생성하고 있습니다..." />
            </div>
          ) : (
            <div className="flex items-stretch h-full gap-2">
              {/* Left arrow */}
              <div className="w-[40px] flex items-center justify-center shrink-0">
                {canScrollLeft && (
                  <FocusableButton
                    focusKey="scroll-left"
                    onClick={() => setStartIndex((i) => Math.max(0, i - 1))}
                    focusedClassName="ring-2 ring-purple-400 rounded-full"
                  >
                    <button className="text-white text-3xl bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-all">
                      ◀
                    </button>
                  </FocusableButton>
                )}
              </div>

              {/* Day grid */}
              <div className="flex-1 grid grid-cols-5 gap-4 h-full overflow-hidden">
                {visibleDays.map((day) => (
                  <ItineraryDayColumn
                    key={day.day}
                    day={day}
                    focusKey={`day-col-${day.day}`}
                  />
                ))}
              </div>

              {/* Right arrow */}
              <div className="w-[40px] flex items-center justify-center shrink-0">
                {canScrollRight && (
                  <FocusableButton
                    focusKey="scroll-right"
                    onClick={() => setStartIndex((i) => Math.min(days.length - PAGE_SIZE, i + 1))}
                    focusedClassName="ring-2 ring-purple-400 rounded-full"
                  >
                    <button className="text-white text-3xl bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center transition-all">
                      ▶
                    </button>
                  </FocusableButton>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dot indicators + Bottom Action */}
        <div className="flex flex-col items-center gap-2 px-16 mb-14">
          {/* Dot indicators */}
          {days.length > PAGE_SIZE && (
            <div className="flex gap-2">
              {days.map((_, idx) => {
                const isVisible = idx >= startIndex && idx < startIndex + PAGE_SIZE;
                return (
                  <div
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      isVisible ? 'bg-purple-400' : 'bg-white/20'
                    }`}
                  />
                );
              })}
            </div>
          )}

          <div className="flex justify-end w-full">
            <FocusableButton
              focusKey="booking-btn"
              onClick={() => navigate('/traveler')}
              className="rounded-full"
              focusedClassName="ring-4 ring-purple-400 scale-105 shadow-purple-500/50"
            >
              <button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-14 py-5 rounded-full text-2xl shadow-2xl transition-all duration-300 flex items-center gap-3">
                항공편 & 호텔 예약
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </FocusableButton>
          </div>
        </div>
      </div>
    </FocusContext.Provider>
  );
}
