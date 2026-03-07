# Travel Agent - Frontend Only (Tizen TV)

Samsung Tizen Smart TV용 AI 여행 에이전트 앱의 프론트엔드 전용 버전입니다.
백엔드(NestJS) 없이 Google Gemini, Google Places API를 브라우저에서 직접 호출하고,
결제 처리만 Cloudflare Worker를 통해 수행합니다.

## 주요 기능

- **AI 여행 일정 생성** - Google Gemini 2.5-flash가 도시별 맞춤 일정을 한국어로 생성
- **실시간 관광지 검색** - Google Places API로 명소 사진, 평점, 설명 제공
- **항공편/호텔 검색** - Mock 데이터 기반 (Amadeus API 형식 호환)
- **QR 코드 결제** - Toss Payments SDK를 통한 모바일 결제 (카카오페이, 토스페이, 삼성페이)
- **TV 리모컨 최적화** - D-pad 공간 네비게이션, 1920x1080 자동 스케일링

## 페이지 흐름

```
DestinationPage → ItineraryPage → TravelerPage → BookingPage
  (관광지 탐색)    (AI 일정 생성)   (여행자 정보)   (항공/호텔/결제)
```

| 페이지 | 경로 | 설명 |
|--------|------|------|
| DestinationPage | `/` | 도시 관광 명소 카드 캐러셀, "Make a Trip" 버튼 |
| ItineraryPage | `/itinerary` | AI 생성 일정 (2~14일), 날짜/기간 조절 |
| TravelerPage | `/traveler` | 여행자 정보 입력 (이름, 여권, 연락처 등) |
| BookingPage | `/booking` | 항공편/호텔 선택 + QR 결제 |

## 기술 스택

| 영역 | 기술 |
|------|------|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| State Management | Zustand 5 (6개 스토어) |
| AI | Google Generative AI SDK (`@google/generative-ai`) |
| 지도/사진 | Google Places API (New) REST |
| 결제 | Toss Payments SDK + Cloudflare Worker |
| TV Navigation | @noriginmedia/norigin-spatial-navigation |
| QR Code | react-qr-code |
| Routing | react-router-dom (MemoryRouter) |

## 프로젝트 구조

```
frontend-only/
├── src/
│   ├── pages/              # 4개 페이지 컴포넌트
│   ├── components/         # 재사용 UI 컴포넌트
│   ├── services/           # API 호출 서비스 (Gemini, Places, Mock)
│   ├── stores/             # Zustand 상태 관리 (6개 스토어)
│   ├── hooks/              # TV 키 핸들러, 결제 폴링
│   ├── api/                # API 클라이언트 (로컬/Worker 라우팅)
│   ├── types/              # TypeScript 타입 정의
│   ├── utils/              # 환율 변환, 공항 코드 등
│   ├── App.tsx             # MemoryRouter + 라우트 정의
│   └── main.tsx            # 뷰포트 스케일링 + 공간 네비 초기화
├── payment-worker/         # Cloudflare Worker (Toss 결제)
│   ├── worker.js
│   └── wrangler.toml
├── public/
│   └── config.xml          # Tizen 앱 매니페스트
└── package.json
```

## 빠른 시작

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 API 키를 입력합니다:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key
VITE_GEMINI_BASE_URL=https://your-gemini-proxy.workers.dev   # 선택사항
VITE_PAYMENT_URL=https://your-toss-worker.workers.dev
```

### 2. 로컬 개발 서버

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속. 키보드 방향키로 네비게이션 가능.

### 3. Tizen TV 빌드 및 배포

```bash
# 빌드
npm run build

# .wgt 패키징 (tizen-cli.sh 사용)
bash tizen-cli.sh package -t wgt -s <security-profile> -- dist/

# 에뮬레이터 설치 및 실행
bash tizen-cli.sh install -n dist/TravelAgent.wgt -s <device-serial>
bash tizen-cli.sh run -p KJ3fEe8sss.TravelAgent -s <device-serial>
```

### 4. 결제 Worker 배포 (Cloudflare)

```bash
cd payment-worker
npx wrangler deploy
```

테스트 모드: `wrangler.toml`에서 `SKIP_TOSS_PAYMENT = "true"` 설정 시 실제 Toss API 호출 없이 결제 성공 시뮬레이션.

## 키보드/리모컨 조작

| 키 | 동작 |
|----|------|
| 방향키 (상하좌우) | 포커스 이동 |
| Enter | 선택/확인 |
| Escape / XF86Back | 이전 페이지로 돌아가기 |

## 동적 도시 지원

앱 실행 시 URL 파라미터 또는 Tizen `app_control`로 도시를 지정할 수 있습니다:

```
http://localhost:5173/?city=Rome&country=Italy
```

지원 도시 (폴백 데이터 포함): Barcelona, Rome, Paris, London, Tokyo

## 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `VITE_GEMINI_API_KEY` | O | Google Gemini API 키 |
| `VITE_GOOGLE_PLACES_API_KEY` | O | Google Places API 키 |
| `VITE_GEMINI_BASE_URL` | X | Gemini API 프록시 URL (지역 제한 우회) |
| `VITE_PAYMENT_URL` | O | Toss 결제 Worker URL |
