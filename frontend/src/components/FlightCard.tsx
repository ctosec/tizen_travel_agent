import { useEffect } from 'react';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { scrollIntoViewSafe } from '../utils/scrollIntoViewSafe';
import { priceToKRW } from '../utils/currency';
import type { FlightOffer } from '../types/booking';

interface FlightCardProps {
  flight: FlightOffer;
  selected: boolean;
  focusKey?: string;
  onSelect?: () => void;
  dictionaries?: Record<string, Record<string, string>>;
}

export default function FlightCard({
  flight,
  selected,
  focusKey,
  onSelect,
  dictionaries,
}: FlightCardProps) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onSelect,
  });

  useEffect(() => {
    if (focused) scrollIntoViewSafe(ref.current);
  }, [focused, ref]);

  const seg = flight.itineraries?.[0]?.segments;
  const firstSeg = seg?.[0];
  const lastSeg = seg?.[seg.length - 1];
  const carrier = firstSeg?.carrierCode || '';
  const airlineName = dictionaries?.carriers?.[carrier] || carrier;
  const stops = seg ? seg.length - 1 : 0;

  const currency = flight.price?.currency || 'EUR';
  const rawPrice = Number(flight.price?.grandTotal || 0);

  return (
    <div
      ref={ref}
      className={`bg-white/5 backdrop-blur-sm border-2 rounded-2xl p-4 cursor-pointer transition-all duration-300 ${
        selected
          ? 'border-blue-500 bg-blue-500/10'
          : focused
          ? 'border-blue-400 ring-2 ring-blue-400'
          : 'border-white/10'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg text-white font-medium">{airlineName}</h3>
            <span className="text-sm text-indigo-300">
              {firstSeg?.carrierCode}{firstSeg?.number}
            </span>
          </div>
          <div className="flex items-center gap-4 mb-1.5">
            <div>
              <p className="text-base text-white">
                {firstSeg?.departure?.at ? new Date(firstSeg.departure.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
              <p className="text-xs text-indigo-200">{firstSeg?.departure?.iataCode}</p>
            </div>
            <div className="flex-1 h-px bg-white/20 relative">
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-300 text-xs bg-slate-900/50 px-1">
                ✈ {stops > 0 ? `${stops}회 경유` : '직항'}
              </span>
            </div>
            <div>
              <p className="text-base text-white">
                {lastSeg?.arrival?.at ? new Date(lastSeg.arrival.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
              <p className="text-xs text-indigo-200">{lastSeg?.arrival?.iataCode}</p>
            </div>
          </div>
          <p className="text-xs text-indigo-300">{flight.itineraries?.[0]?.duration?.replace('PT', '').toLowerCase()}</p>
        </div>
        <div className="text-right ml-4">
          <p className="text-xl text-white mb-1">
            {priceToKRW(rawPrice, currency)}
          </p>
          {selected && (
            <div className="bg-blue-500 text-white rounded-full p-1 inline-block">
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
