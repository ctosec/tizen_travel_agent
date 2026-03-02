import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { API_BASE } from '../api/client';

interface AttractionCardProps {
  name: string;
  description: string;
  photoUrl: string | null;
  rating: number | null;
  focused?: boolean;
  focusKey?: string;
}

function resolvePhotoUrl(photoUrl: string | null): string {
  if (!photoUrl) return '';
  if (photoUrl.startsWith('http')) return photoUrl;
  // Relative URL from backend — prefix with API base (without /api)
  const base = API_BASE.replace('/api', '');
  return `${base}${photoUrl}`;
}

export default function AttractionCard({
  name,
  description,
  photoUrl,
  rating,
  focusKey,
}: AttractionCardProps) {
  const { ref, focused } = useFocusable({ focusKey });

  return (
    <div
      ref={ref}
      className="relative transition-all duration-300 ease-out cursor-pointer outline-none"
      style={{
        transform: focused ? 'scale(1.1)' : 'scale(1)',
        zIndex: focused ? 10 : 1,
      }}
    >
      <div
        className={`w-80 h-[580px] bg-white rounded-2xl overflow-hidden shadow-2xl transition-all ${
          focused ? 'ring-4 ring-blue-500' : ''
        }`}
      >
        <div className="h-[340px] overflow-hidden bg-slate-200">
          {photoUrl ? (
            <img
              src={resolvePhotoUrl(photoUrl)}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-6xl">
              🏛️
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-slate-800 truncate">{name}</h3>
            {rating && (
              <span className="text-sm text-amber-500 font-medium">★ {rating.toFixed(1)}</span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-6">{description}</p>
        </div>
      </div>
    </div>
  );
}
