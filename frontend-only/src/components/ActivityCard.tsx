import { useEffect, useCallback } from 'react';
import { useFocusable, setFocus } from '@noriginmedia/norigin-spatial-navigation';

interface ActivityCardProps {
  time: string;
  activity: string;
  location: string;
  photoUrl: string | null;
  focusKey?: string;
  dayNum?: number;
  activityIndex?: number;
  totalDays?: number;
}

export default function ActivityCard({
  time,
  activity,
  location,
  photoUrl,
  focusKey,
  dayNum,
  activityIndex,
  totalDays,
}: ActivityCardProps) {
  const onArrowPress = useCallback(
    (direction: string) => {
      if (dayNum == null || activityIndex == null || totalDays == null) return true;
      if (direction === 'right' && dayNum < totalDays) {
        setFocus(`day-col-${dayNum + 1}-activity-${activityIndex}`);
        return false;
      }
      if (direction === 'left' && dayNum > 1) {
        setFocus(`day-col-${dayNum - 1}-activity-${activityIndex}`);
        return false;
      }
      return true;
    },
    [dayNum, activityIndex, totalDays],
  );

  const { ref, focused } = useFocusable({ focusKey, onArrowPress });

  useEffect(() => {
    if (focused && ref.current) {
      ref.current.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focused, ref]);

  return (
    <div
      ref={ref}
      className={`bg-white/5 backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-200 ${
        focused ? 'border-purple-400 ring-2 ring-purple-400 scale-105' : 'border-white/10'
      }`}
    >
      {photoUrl && (
        <div className="h-24 overflow-hidden">
          <img
            src={photoUrl}
            alt={location}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded font-medium">
            {time}
          </span>
        </div>
        <p className="text-sm text-white mb-1 line-clamp-2">{activity}</p>
        <p className="text-xs text-indigo-300 truncate">{location}</p>
      </div>
    </div>
  );
}
