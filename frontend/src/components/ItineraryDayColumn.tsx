import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import type { ItineraryDay } from '../types/itinerary';
import ActivityCard from './ActivityCard';

interface ItineraryDayColumnProps {
  day: ItineraryDay;
  focusKey: string;
}

export default function ItineraryDayColumn({
  day,
  focusKey: propFocusKey,
}: ItineraryDayColumnProps) {
  const { ref, focusKey } = useFocusable({ focusKey: propFocusKey });

  const dateObj = new Date(day.date + 'T00:00:00');
  const weekday = dateObj.toLocaleDateString('ko-KR', { weekday: 'short' });
  const dateStr = dateObj.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="flex flex-col gap-3 min-w-0">
        <div className="text-center mb-1">
          <div className="text-lg text-white font-semibold">Day {day.day}</div>
          <div className="text-sm text-indigo-300">
            {dateStr} ({weekday})
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {day.activities.map((activity, idx) => (
            <ActivityCard
              key={idx}
              time={activity.time}
              activity={activity.activity}
              location={activity.location}
              photoUrl={activity.photoUrl}
              focusKey={`${focusKey}-activity-${idx}`}
            />
          ))}
        </div>
      </div>
    </FocusContext.Provider>
  );
}
