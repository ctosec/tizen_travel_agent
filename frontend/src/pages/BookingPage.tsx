import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FocusContext, useFocusable, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useBookingStore } from '../stores/bookingStore';
import { useItineraryStore } from '../stores/itineraryStore';
import { usePaymentStore, PAYMENT_METHODS } from '../stores/paymentStore';
import { useTravelerStore } from '../stores/travelerStore';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { toKRW, formatKRW } from '../utils/currency';
import FlightCard from '../components/FlightCard';
import HotelCard from '../components/HotelCard';
import QRPayment from '../components/QRPayment';
import FocusableButton from '../components/FocusableButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTVKeys } from '../hooks/useTVKeys';

/* ------------------------------------------------------------------ */
/*  PaymentMethodButton — inline sub-component                        */
/* ------------------------------------------------------------------ */
function PaymentMethodButton({
  label,
  icon,
  focusKey,
  isSelected,
  onPress,
}: {
  label: string;
  icon: string;
  focusKey: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: onPress,
  });

  return (
    <div
      ref={ref}
      onClick={onPress}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
        isSelected
          ? 'border-emerald-400 bg-emerald-500/20'
          : focused
          ? 'border-purple-400 ring-2 ring-purple-400 bg-white/10'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-white text-base">{label}</span>
      {isSelected && (
        <svg className="w-5 h-5 text-emerald-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BookingPage                                                        */
/* ------------------------------------------------------------------ */
export default function BookingPage() {
  const navigate = useNavigate();
  const { ref, focusKey } = useFocusable({ isFocusBoundary: true });
  const {
    flights,
    hotels,
    selectedFlight,
    selectedHotel,
    flightsLoading,
    hotelsLoading,
    searchFlights,
    searchHotels,
    selectFlight,
    selectHotel,
  } = useBookingStore();
  const { startDate, duration } = useItineraryStore();
  const traveler = useTravelerStore();
  const {
    orderId,
    status,
    qrUrl,
    isCreating,
    selectedMethod,
    createSession,
    setSelectedMethod,
    reset: resetPayment,
  } = usePaymentStore();

  useTVKeys({ onBack: () => navigate('/traveler') });

  usePaymentStatus(orderId);

  // Set initial focus when flights load
  useEffect(() => {
    if (flights.length > 0 && !flightsLoading) {
      const timer = setTimeout(() => setFocus('flight-0'), 100);
      return () => clearTimeout(timer);
    }
  }, [flights, flightsLoading]);

  const nights = duration - 1;

  // Search flights and hotels on mount
  useEffect(() => {
    if (flights.length === 0 && !flightsLoading) {
      searchFlights('ICN', 'BCN', startDate);
    }
    if (hotels.length === 0 && !hotelsLoading) {
      const checkOut = new Date(startDate);
      checkOut.setDate(checkOut.getDate() + nights);
      searchHotels('BCN', startDate, checkOut.toISOString().split('T')[0]);
    }
  }, [flights.length, hotels.length, flightsLoading, hotelsLoading, searchFlights, searchHotels, startDate, nights]);

  // Toggle selection handlers
  const handleFlightSelect = useCallback(
    (flight: typeof flights[0]) => {
      if (selectedFlight?.id === flight.id) {
        selectFlight(null);
        resetPayment();
      } else {
        selectFlight(flight);
      }
    },
    [selectedFlight, selectFlight, resetPayment],
  );

  const handleHotelSelect = useCallback(
    (hotel: typeof hotels[0]) => {
      if (selectedHotel?.hotel?.hotelId === hotel.hotel?.hotelId) {
        selectHotel(null);
        resetPayment();
      } else {
        selectHotel(hotel);
      }
    },
    [selectedHotel, selectHotel, resetPayment],
  );

  // Price calculations with currency conversion
  const flightCurrency = selectedFlight?.price?.currency || 'EUR';
  const hotelCurrency = selectedHotel?.offers?.[0]?.price?.currency || 'EUR';
  const flightPriceKRW = toKRW(Number(selectedFlight?.price?.grandTotal || 0), flightCurrency);
  const hotelPriceKRW = toKRW(Number(selectedHotel?.offers?.[0]?.price?.total || 0), hotelCurrency);
  const totalAmountKRW = flightPriceKRW + hotelPriceKRW;
  const canPay = selectedFlight && selectedHotel;
  const orderName = 'Barcelona Travel Package';

  // Format traveler data for booking
  function formatDateForApi(yyyymmdd: string): string {
    if (yyyymmdd.length !== 8) return yyyymmdd;
    return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
  }

  // Handle payment method selection
  const handleMethodSelect = useCallback(
    async (methodId: string) => {
      if (!canPay) return;
      setSelectedMethod(methodId);
      resetPayment();

      const travelerData = {
        id: '1',
        dateOfBirth: formatDateForApi(traveler.dateOfBirth),
        name: { firstName: traveler.firstName.toUpperCase(), lastName: traveler.lastName.toUpperCase() },
        gender: traveler.gender,
        contact: {
          emailAddress: traveler.email,
          phones: [{ deviceType: 'MOBILE', countryCallingCode: traveler.countryCode, number: traveler.phone }],
        },
        documents: traveler.passportNumber
          ? [{
              documentType: 'PASSPORT',
              number: traveler.passportNumber,
              expiryDate: formatDateForApi(traveler.passportExpiry),
              issuanceCountry: traveler.nationality,
              nationality: traveler.nationality,
              holder: true,
            }]
          : undefined,
      };

      await createSession({
        amount: totalAmountKRW,
        orderName,
        bookingType: 'package',
        bookingData: {
          flightOffer: selectedFlight,
          hotelOffer: selectedHotel,
          travelers: [travelerData],
        },
        selectedMethod: methodId,
      });
    },
    [canPay, totalAmountKRW, selectedFlight, selectedHotel, traveler, setSelectedMethod, resetPayment, createSession],
  );

  const isSuccess = status === 'SUCCESS';

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="w-[1920px] h-[1080px] bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="pt-6 px-16 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-4xl text-white mb-1">항공편 & 호텔 선택</h1>
            <p className="text-base text-indigo-200">
              {duration}일 여행 — 호텔 {nights}박 (Day 1 ~ Day {duration - 1})
            </p>
          </div>
          <div className="flex gap-3">
            <FocusableButton
              focusKey="select-all-btn"
              onClick={() => {
                if (flights.length > 0) selectFlight(flights[0]);
                if (hotels.length > 0) selectHotel(hotels[0]);
              }}
              className="rounded-full"
              focusedClassName="ring-2 ring-white/50 bg-white/20 scale-105"
            >
              <button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-2.5 rounded-full text-base transition-all">
                전체 선택
              </button>
            </FocusableButton>
            <FocusableButton
              focusKey="deselect-btn"
              onClick={() => {
                selectFlight(null);
                selectHotel(null);
                resetPayment();
              }}
              className="rounded-full"
              focusedClassName="ring-2 ring-white/50 bg-white/20 scale-105"
            >
              <button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-2.5 rounded-full text-base transition-all">
                선택 해제
              </button>
            </FocusableButton>
          </div>
        </div>

        {/* 3-column layout */}
        <div className="flex-1 px-16 overflow-hidden grid grid-cols-[1fr_1fr_400px] gap-6">
          {/* Left: Flights */}
          <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-blue-400 text-2xl">✈</span>
              <h2 className="text-2xl text-white">항공편</h2>
            </div>
            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
              {flightsLoading ? (
                <LoadingSpinner text="항공편 검색중..." />
              ) : flights.length === 0 ? (
                <p className="text-indigo-300 text-center py-10">검색 결과가 없습니다</p>
              ) : (
                flights.slice(0, 5).map((flight, idx) => (
                  <FlightCard
                    key={flight.id || idx}
                    flight={flight}
                    selected={selectedFlight?.id === flight.id}
                    focusKey={`flight-${idx}`}
                    onSelect={() => handleFlightSelect(flight)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Center: Hotels */}
          <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-emerald-400 text-2xl">🏨</span>
              <h2 className="text-2xl text-white">호텔 ({nights}박)</h2>
            </div>
            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
              {hotelsLoading ? (
                <LoadingSpinner text="호텔 검색중..." />
              ) : hotels.length === 0 ? (
                <p className="text-indigo-300 text-center py-10">검색 결과가 없습니다</p>
              ) : (
                hotels.slice(0, 5).map((hotel, idx) => (
                  <HotelCard
                    key={hotel.hotel?.hotelId || idx}
                    hotel={hotel}
                    selected={selectedHotel?.hotel?.hotelId === hotel.hotel?.hotelId}
                    focusKey={`hotel-${idx}`}
                    onSelect={() => handleHotelSelect(hotel)}
                    nights={nights}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right: Payment Panel */}
          <div className="flex flex-col h-full min-h-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 overflow-y-auto">
            <h2 className="text-xl text-white font-semibold mb-4">결제</h2>

            {/* Price Summary */}
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-base">
                <span className="text-indigo-300">항공편</span>
                <span className="text-white">
                  {selectedFlight ? formatKRW(flightPriceKRW) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-indigo-300">호텔 ({nights}박)</span>
                <span className="text-white">
                  {selectedHotel ? formatKRW(hotelPriceKRW) : '—'}
                </span>
              </div>
              <div className="h-px bg-white/20 my-2" />
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-white">합계</span>
                <span className="text-emerald-400">
                  {canPay ? formatKRW(totalAmountKRW) : '—'}
                </span>
              </div>
            </div>

            {!canPay ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-amber-400 text-center text-sm">
                  항공편과 호텔을 모두 선택해주세요
                </p>
              </div>
            ) : isSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="text-6xl">✅</div>
                <p className="text-2xl text-emerald-400 font-bold">결제 완료!</p>
                <p className="text-base text-indigo-200">예약이 확인되었습니다</p>
              </div>
            ) : (
              <>
                {/* Payment method buttons */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-indigo-300 mb-2">결제 수단 선택</p>
                  {PAYMENT_METHODS.map((method) => (
                    <PaymentMethodButton
                      key={method.id}
                      label={method.label}
                      icon={method.icon}
                      focusKey={`pay-method-${method.id}`}
                      isSelected={selectedMethod === method.id}
                      onPress={() => handleMethodSelect(method.id)}
                    />
                  ))}
                </div>

                {/* QR Code */}
                {isCreating && (
                  <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner text="결제 세션 생성중..." />
                  </div>
                )}
                {status === 'PENDING' && qrUrl && (
                  <div className="flex-1 flex flex-col items-center gap-3">
                    <QRPayment qrUrl={qrUrl} />
                    <p className="text-xs text-indigo-300 text-center">
                      모바일로 QR을 스캔하세요
                    </p>
                  </div>
                )}
                {status === 'FAIL' && (
                  <p className="text-red-400 text-center text-sm mt-2">결제에 실패했습니다. 다시 시도해주세요.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-3" />
      </div>
    </FocusContext.Provider>
  );
}
