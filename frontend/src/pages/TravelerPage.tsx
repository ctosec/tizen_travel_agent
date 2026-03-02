import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FocusContext, useFocusable, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useTravelerStore } from '../stores/travelerStore';
import FocusableInput from '../components/FocusableInput';
import FocusableButton from '../components/FocusableButton';
import { useTVKeys } from '../hooks/useTVKeys';

const digitsOnly = (v: string) => v.replace(/\D/g, '');

export default function TravelerPage() {
  const navigate = useNavigate();
  const { ref, focusKey } = useFocusable({
    isFocusBoundary: true,
  });

  useTVKeys({ onBack: () => navigate('/itinerary') });

  /* Local form state */
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [countryCode, setCountryCode] = useState('82');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [nationality, setNationality] = useState('KR');

  /* Pre-fill from stored traveler data (wait for Zustand persist hydration) */
  useEffect(() => {
    const sync = () => {
      const s = useTravelerStore.getState();
      if (s.lastName) setLastName(s.lastName);
      if (s.firstName) setFirstName(s.firstName);
      if (s.email) setEmail(s.email);
      if (s.phone) setPhone(s.phone);
      if (s.dateOfBirth) setDateOfBirth(s.dateOfBirth);
      if (s.gender) setGender(s.gender);
      if (s.countryCode) setCountryCode(s.countryCode);
      if (s.passportNumber) setPassportNumber(s.passportNumber);
      if (s.passportExpiry) setPassportExpiry(s.passportExpiry);
      if (s.nationality) setNationality(s.nationality);
    };
    if (useTravelerStore.persist.hasHydrated()) {
      sync();
    } else {
      const unsub = useTravelerStore.persist.onFinishHydration(() => {
        sync();
        unsub();
      });
      return unsub;
    }
  }, []);

  // Set initial focus to first input
  useEffect(() => {
    const timer = setTimeout(() => setFocus('trav-lastname'), 100);
    return () => clearTimeout(timer);
  }, []);

  const canProceed = lastName && firstName && email && phone;

  const handleNext = useCallback(() => {
    if (!canProceed) return;
    useTravelerStore.getState().setTravelerData({
      lastName,
      firstName,
      email,
      phone,
      dateOfBirth,
      gender,
      countryCode,
      passportNumber,
      passportExpiry,
      nationality,
    });
    navigate('/booking');
  }, [
    canProceed, lastName, firstName, email, phone, dateOfBirth,
    gender, countryCode, passportNumber, passportExpiry, nationality,
    navigate,
  ]);

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className="w-[1920px] h-[1080px] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="pt-6 px-16 pb-4">
          <h1 className="text-4xl text-white mb-1">여행자 정보</h1>
          <p className="text-base text-purple-200">
            항공편 예약에 필요한 여행자 정보를 입력하세요
          </p>
        </div>

        {/* Form */}
        <div className="flex-1 px-16 overflow-y-auto">
          <div className="grid grid-cols-3 gap-x-8 gap-y-5 max-w-[1400px]">
            {/* Basic Info */}
            <FocusableInput
              focusKey="trav-lastname"
              label="성 (Last Name)"
              value={lastName}
              onChange={setLastName}
              placeholder="HONG"
            />
            <FocusableInput
              focusKey="trav-firstname"
              label="이름 (First Name)"
              value={firstName}
              onChange={setFirstName}
              placeholder="GILDONG"
            />
            <FocusableInput
              focusKey="trav-email"
              label="이메일"
              value={email}
              onChange={setEmail}
              placeholder="user@example.com"
            />
            <FocusableInput
              focusKey="trav-phone"
              label="전화번호"
              value={phone}
              onChange={setPhone}
              placeholder="01012345678"
              maxLength={11}
              filter={digitsOnly}
            />
            <FocusableInput
              focusKey="trav-dob"
              label="생년월일 (YYYYMMDD)"
              value={dateOfBirth}
              onChange={setDateOfBirth}
              placeholder="19900101"
              maxLength={8}
              filter={digitsOnly}
            />

            {/* Gender */}
            <div className="flex flex-col gap-2">
              <label className="text-sm text-indigo-300 font-medium">성별</label>
              <div className="flex gap-3">
                <FocusableButton
                  focusKey="trav-male"
                  onClick={() => setGender('MALE')}
                  className="rounded-xl"
                  focusedClassName="ring-2 ring-purple-400 scale-105"
                >
                  <button
                    className={`px-6 py-3 rounded-xl text-base transition-all border-2 ${
                      gender === 'MALE'
                        ? 'border-purple-400 bg-purple-500/30 text-white'
                        : 'border-white/20 bg-white/5 text-indigo-300'
                    }`}
                  >
                    남성
                  </button>
                </FocusableButton>
                <FocusableButton
                  focusKey="trav-female"
                  onClick={() => setGender('FEMALE')}
                  className="rounded-xl"
                  focusedClassName="ring-2 ring-purple-400 scale-105"
                >
                  <button
                    className={`px-6 py-3 rounded-xl text-base transition-all border-2 ${
                      gender === 'FEMALE'
                        ? 'border-purple-400 bg-purple-500/30 text-white'
                        : 'border-white/20 bg-white/5 text-indigo-300'
                    }`}
                  >
                    여성
                  </button>
                </FocusableButton>
              </div>
            </div>

            {/* Passport & Nationality */}
            <FocusableInput
              focusKey="trav-countrycode"
              label="국가 코드"
              value={countryCode}
              onChange={setCountryCode}
              placeholder="82"
              maxLength={4}
            />
            <FocusableInput
              focusKey="trav-passport"
              label="여권번호"
              value={passportNumber}
              onChange={setPassportNumber}
              placeholder="M12345678"
            />
            <FocusableInput
              focusKey="trav-passexpiry"
              label="여권 만료일 (YYYYMMDD)"
              value={passportExpiry}
              onChange={setPassportExpiry}
              placeholder="20300101"
              maxLength={8}
              filter={digitsOnly}
            />
            <FocusableInput
              focusKey="trav-nationality"
              label="국적"
              value={nationality}
              onChange={setNationality}
              placeholder="KR"
              maxLength={2}
            />
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex justify-between items-center px-16 mb-14">
          <FocusableButton
            focusKey="trav-back"
            onClick={() => navigate('/itinerary')}
            className="rounded-full"
            focusedClassName="ring-2 ring-white/50 bg-white/20 scale-105"
          >
            <button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-10 py-4 rounded-full text-xl transition-all">
              이전
            </button>
          </FocusableButton>

          {!canProceed && (
            <p className="text-amber-400 text-sm">
              성, 이름, 이메일, 전화번호는 필수 항목입니다
            </p>
          )}

          <FocusableButton
            focusKey="trav-next"
            onClick={handleNext}
            disabled={!canProceed}
            className="rounded-full"
            focusedClassName="ring-4 ring-purple-400 scale-105 shadow-purple-500/50"
            disabledClassName="opacity-50"
          >
            <button
              disabled={!canProceed}
              className={`px-14 py-5 rounded-full text-2xl shadow-2xl transition-all flex items-center gap-3 ${
                canProceed
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              항공편 & 호텔 선택
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </FocusableButton>
        </div>
      </div>
    </FocusContext.Provider>
  );
}
