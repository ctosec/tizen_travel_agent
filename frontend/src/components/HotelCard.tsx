import { useEffect } from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { scrollIntoViewSafe } from '../utils/scrollIntoViewSafe';
import { priceToKRW } from '../utils/currency';
import type { HotelOffer } from '../types/booking';

interface HotelCardProps {
  hotel: HotelOffer;
  selected: boolean;
  focusKey?: string;
  onSelect?: () => void;
  nights?: number;
}

export default function HotelCard({
  hotel,
  selected,
  focusKey,
  onSelect,
  nights,
}: HotelCardProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onSelect,
  });

  useEffect(() => {
    if (focused) scrollIntoViewSafe(ref.current);
  }, [focused, ref]);

  const offer = hotel.offers?.[0];
  const price = offer?.price;
  const room = offer?.room;
  const currency = price?.currency || 'EUR';
  const rawTotal = Number(price?.total || 0);

  return (
    <div
      ref={ref}
      className={`bg-white/5 backdrop-blur-sm border-2 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
        selected
          ? 'border-emerald-500 bg-emerald-500/10'
          : focused
          ? 'border-emerald-400 ring-2 ring-emerald-400'
          : 'border-white/10'
      }`}
    >
      <div className="p-4 flex justify-between">
        <div className="flex-1">
          <h3 className="text-base text-white mb-1 font-medium">{hotel.hotel?.name}</h3>
          <p className="text-xs text-indigo-200 mb-2">{hotel.hotel?.cityCode}</p>
          {room?.typeEstimated?.category && (
            <span className="bg-white/10 text-indigo-200 text-xs px-2 py-0.5 rounded">
              {room.typeEstimated.category}
            </span>
          )}
          {room?.description?.text && (
            <p className="text-xs text-indigo-300 mt-2 line-clamp-2">{room.description.text}</p>
          )}
        </div>
        <div className="text-right ml-3">
          <p className="text-lg text-white mb-0.5">
            {priceToKRW(rawTotal, currency)}
          </p>
          <p className="text-xs text-indigo-300">
            {nights ? `${nights}박 총액` : '총액'}
          </p>
          {selected && (
            <div className="bg-emerald-500 text-white rounded-full p-1 mt-2 inline-block">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
