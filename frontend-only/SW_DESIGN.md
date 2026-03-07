# Software Design Document - Travel Agent (Frontend Only)

## 1. 개요

본 문서는 Samsung Tizen Smart TV용 AI 여행 에이전트 앱의 프론트엔드 전용 아키텍처를 기술합니다.
기존 NestJS 백엔드를 제거하고, AI/검색 기능을 브라우저에 통합하며, 결제 처리만 Cloudflare Worker로 분리한 구조입니다.

### 1.1 설계 목표

- 별도 서버 없이 단일 정적 파일(.wgt)로 배포 가능
- Google Gemini/Places API를 브라우저에서 직접 호출
- 결제 시크릿 키는 서버사이드(Worker)에서 안전하게 처리
- TV 리모컨(D-pad) 기반 UX 최적화
- 1920x1080 고정 디자인, 모든 해상도 자동 스케일링

### 1.2 아키텍처 요약

```
┌─────────────────────────────────────────────────┐
│              Tizen TV App (Browser)              │
│                                                  │
│  React 19 + Zustand + Spatial Navigation         │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Services │  │  Stores  │  │  Components  │   │
│  │(API호출) │←→│ (상태)   │←→│   (UI렌더)   │   │
│  └────┬─────┘  └──────────┘  └──────────────┘   │
│       │                                          │
└───────┼──────────────────────────────────────────┘
        │
        ├──→ Google Gemini API (AI 일정/설명 생성)
        ├──→ Google Places API (관광지 검색/사진)
        ├──→ Mock Data (항공편/호텔)
        └──→ Cloudflare Worker (Toss 결제)
                    │
                    └──→ Toss Payments API
```

## 2. 서비스 계층 설계

### 2.1 Gemini 서비스 (`services/gemini.ts`)

Google Generative AI SDK를 브라우저에서 직접 사용합니다.

```
getModel() → GoogleGenerativeAI 인스턴스 (싱글톤)
  ├── 모델: gemini-2.5-flash
  ├── API 키: VITE_GEMINI_API_KEY
  └── Base URL: VITE_GEMINI_BASE_URL (선택, 지역 제한 우회용)

generateText(prompt) → string
generateJSON<T>(prompt) → T (JSON 파싱)
```

**지역 제한 우회**: 한국 등 일부 지역에서 Gemini API 직접 호출이 차단될 수 있어, Cloudflare Worker를 프록시로 사용할 수 있습니다 (`VITE_GEMINI_BASE_URL`).

### 2.2 Places 서비스 (`services/places.ts`)

Google Places API (New)를 REST로 직접 호출합니다.

```
textSearch(query, maxResults) → PlaceResult[]
  - POST https://places.googleapis.com/v1/places:searchText
  - Header: X-Goog-Api-Key, X-Goog-FieldMask
  - 한국어(languageCode: "ko") 결과 반환

getPhotoUrl(photoRef, maxWidth) → string
  - https://places.googleapis.com/v1/{photoRef}/media?...
  - 브라우저에서 직접 로드 가능한 URL 반환
```

### 2.3 Destination 서비스 (`services/destination.ts`)

관광지 데이터를 조합하는 오케스트레이터입니다.

```
getDestination(country, city)
  1. Places textSearch("top tourist attractions in {city}, {country}")
  2. Gemini generateJSON → 각 명소별 한국어 설명 (2~3문장)
  3. 결과 병합: name + description + photoUrl + rating
  4. 캐시 저장 (TTL: 10분)
```

### 2.4 Itinerary 서비스 (`services/itinerary.ts`)

AI 기반 여행 일정 생성 서비스입니다.

```
generateItinerary(input)
  1. Gemini에 프롬프트 전송 (도시, 기간, 시작일)
  2. JSON 배열 파싱: [{day, date, activities[{time, activity, location}]}]
  3. 각 activity → Places textSearch → photoUrl 보강
  4. 실패 시 → 도시별 하드코딩된 폴백 데이터 사용

폴백 도시: Barcelona, Rome, Paris, London, Tokyo, Default
캐시 키: "{city}-{duration}-{startDate}" (TTL: 10분)
```

### 2.5 Mock 서비스 (`services/mockFlights.ts`, `services/mockHotels.ts`)

Amadeus API 형식과 호환되는 모의 데이터를 생성합니다.

```
searchMockFlights(params) → FlightOffer[5]
  - 항공사: KE, OZ, LH, AF, BA, TK, EK, SQ
  - 직항/1회/2회 경유, 가격 600~2200 EUR
  - 가격순 정렬

searchMockHotels(params) → HotelOffer[5]
  - 도시별 호텔 템플릿 (실제 호텔명 사용)
  - 방 유형: Standard/Superior/Deluxe/Suite
  - 가격 150~800 EUR/박, 가격순 정렬
```

## 3. 상태 관리 설계

Zustand 5 기반 6개 독립 스토어로 상태를 관리합니다.

```
┌──────────────────┐     ┌──────────────────┐
│ travelConfigStore│────→│ destinationStore  │
│  city, country,  │     │  attractions[],   │
│  airportCode     │────→│  loading, error   │
└──────────────────┘     └──────────────────┘
        │
        ├───────────────→┌──────────────────┐
        │                │ itineraryStore    │
        │                │  days[], duration,│
        │                │  startDate        │
        │                └──────────────────┘
        │
        │                ┌──────────────────┐
        │                │ travelerStore     │ ← localStorage 영속화
        │                │  이름, 여권, 연락처│
        │                └──────────────────┘
        │
        └───────────────→┌──────────────────┐     ┌──────────────────┐
                         │ bookingStore      │────→│ paymentStore     │
                         │  flights, hotels, │     │  orderId, status,│
                         │  selected*        │     │  qrUrl, method   │
                         └──────────────────┘     └──────────────────┘
```

### 3.1 스토어별 역할

| 스토어 | 영속화 | 역할 |
|--------|--------|------|
| `travelConfigStore` | X | 선택된 도시/국가/공항코드 (앱 진입점) |
| `destinationStore` | X | 관광 명소 데이터 (API 조회 결과) |
| `itineraryStore` | X | AI 생성 일정, 시작일, 기간 |
| `travelerStore` | O (localStorage) | 여행자 개인정보 (폼 데이터) |
| `bookingStore` | X | 항공편/호텔 검색 결과 및 선택 |
| `paymentStore` | X | 결제 세션, QR URL, 상태 폴링 |

### 3.2 도시 설정 흐름

```
앱 시작
  ├─ Tizen app_control 파라미터? → city, country 추출
  ├─ URL 쿼리 파라미터? → ?city=Rome&country=Italy
  └─ 기본값 → Barcelona, Spain, BCN

travelConfigStore.setDestination(city, country)
  → airportCode 자동 매핑 (airportCodes.ts)
  → destinationStore.fetchDestination() 트리거
```

## 4. 결제 시스템 설계

### 4.1 결제 아키텍처

```
┌──────────┐    ┌───────────────────┐    ┌──────────────┐
│  TV 앱   │    │ Cloudflare Worker │    │ Toss API     │
│(브라우저)│    │  (payment-worker) │    │              │
└────┬─────┘    └────────┬──────────┘    └──────┬───────┘
     │                   │                       │
     │ 1. POST /api/sessions                     │
     │   (orderId, amount, method)               │
     │──────────────────→│                       │
     │                   │ 세션 생성 (Map)        │
     │←──────────────────│                       │
     │   {orderId}       │                       │
     │                   │                       │
     │ 2. QR 코드 생성    │                       │
     │   (checkout URL)  │                       │
     │                   │                       │
     ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
     │     [사용자 모바일 QR 스캔]                │
     │                   │                       │
     │                   │ 3. GET /api/checkout   │
     │               모바일│──→│                  │
     │                   │ Toss SDK 로드          │
     │                   │ easyPay 결제 실행      │
     │                   │          │             │
     │                   │ 4. Toss 콜백           │
     │                   │←─────────┤             │
     │                   │ GET /api/toss-result   │
     │                   │ ?paymentKey=...        │
     │                   │                       │
     │                   │ 5. POST confirm        │
     │                   │──────────────────────→│
     │                   │   paymentKey, orderId  │
     │                   │   amount               │
     │                   │←──────────────────────│
     │                   │   {status: "DONE"}     │
     │                   │ 세션 상태 → SUCCESS     │
     │                   │                       │
     │ 6. GET /api/sessions/:id/status            │
     │──────────────────→│  (2초 간격 폴링)       │
     │←──────────────────│                       │
     │   {status: "SUCCESS"}                     │
     │                   │                       │
     │ 결제 완료 표시     │                       │
```

### 4.2 Worker 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/sessions` | POST | 결제 세션 생성 |
| `/api/sessions/:orderId/status` | GET | 세션 상태 조회 (TV 폴링용) |
| `/api/sessions/:orderId/complete` | POST | Toss 결제 확인 (서버→Toss API) |
| `/api/checkout` | GET | Toss SDK 체크아웃 페이지 (모바일 브라우저용) |
| `/api/toss-result` | GET | Toss 리다이렉트 핸들러 (성공/취소/실패) |

### 4.3 결제 수단 매핑

| TV 앱 표시 | paymentStore method | Toss easyPay provider |
|-----------|--------------------|-----------------------|
| 카카오페이 | `kakaopay` | `KAKAOPAY` |
| 토스페이 | `tosspay` | `TOSSPAY` |
| 삼성페이 | `samsungpay` | `SAMSUNGPAY` |

### 4.4 테스트 모드

Worker의 `SKIP_TOSS_PAYMENT=true` 설정 시:
- Toss API 실제 호출을 건너뜀
- 즉시 결제 성공(`SUCCESS`) 응답 반환
- 개발/데모 환경에서 사용

## 5. UI/UX 설계

### 5.1 화면 해상도

- 기준 해상도: **1920 x 1080** (Full HD)
- 스케일링: `main.tsx`에서 `window.innerWidth / 1920` 비율로 CSS transform 적용
- 모든 TV 해상도에서 레이아웃 유지 (4K TV에서도 동일 비율)

### 5.2 공간 네비게이션 (Spatial Navigation)

`@noriginmedia/norigin-spatial-navigation` 라이브러리 사용:

```
모든 인터랙티브 요소 → useFocusable() 훅
  ├── focusKey: 고유 식별자
  ├── onEnterPress: Enter 키 핸들러
  └── onArrowPress: 방향키 핸들러 (커스텀 네비게이션)
```

### 5.3 FocusableInput 동작

TV 환경에서 텍스트 입력을 위한 듀얼 모드 컴포넌트:

```
[브라우징 모드]        [편집 모드]
  방향키 → 포커스 이동    문자 입력 가능
  Enter → 편집 모드 진입  Escape → 브라우징 모드
  문자 키 → 자동 편집 진입 방향키 → 편집 모드 종료
```

### 5.4 키 매핑

| 키 | TV 리모컨 | 앱 동작 |
|----|----------|---------|
| Arrow Keys | D-pad | 포커스 이동 |
| Enter | OK/Select | 선택, 편집 모드 진입 |
| Escape | Back | 이전 페이지, 편집 모드 종료 |
| XF86Back | Back (Tizen) | 이전 페이지 |

## 6. API 클라이언트 라우팅 (`api/client.ts`)

로컬 서비스와 원격 Worker를 통합하는 라우팅 레이어입니다.

| API 호출 | 처리 위치 | 구현 |
|----------|----------|------|
| `getDestination()` | 브라우저 (로컬) | `services/destination.ts` |
| `generateItinerary()` | 브라우저 (로컬) | `services/itinerary.ts` |
| `searchFlights()` | 브라우저 (로컬) | `services/mockFlights.ts` |
| `searchHotels()` | 브라우저 (로컬) | `services/mockHotels.ts` |
| `createPaymentSession()` | Cloudflare Worker | POST `/api/sessions` |
| `getPaymentStatus()` | Cloudflare Worker | GET `/api/sessions/:id/status` |

## 7. 캐싱 전략

| 대상 | 캐시 위치 | TTL | 캐시 키 |
|------|----------|-----|---------|
| 관광지 데이터 | 메모리 (Map) | 10분 | `"{country}-{city}"` |
| AI 일정 데이터 | 메모리 (Map) | 10분 | `"{city}-{duration}-{startDate}"` |
| 여행자 정보 | localStorage | 영구 | `"traveler-data"` |
| 결제 세션 | Worker 메모리 | 30분 | orderId |

## 8. 빌드 및 배포

### 8.1 빌드 설정

```javascript
// vite.config.ts
{
  base: './',           // 상대 경로 (wgt 패키징 호환)
  build: {
    target: 'es2017'    // Tizen TV WebKit 호환
  }
}
```

### 8.2 Tizen 앱 설정 (`config.xml`)

```xml
<widget id="KJ3fEe8sss.TravelAgent" version="1.0.0">
  <tizen:application id="KJ3fEe8sss.TravelAgent" required_version="4.0"/>
  <tizen:privilege name="http://tizen.org/privilege/internet"/>
  <tizen:setting pointing-device-support="disable"/>
</widget>
```

- `pointing-device-support="disable"`: 마우스 비활성화 (리모컨 전용)
- `internet` 권한: Google API, Worker 호출에 필요

### 8.3 배포 파이프라인

```
소스 코드
  → npm run build (Vite)
  → dist/ (정적 파일)
  → tizen-cli.sh package (wgt 서명)
  → dist/TravelAgent.wgt
  → tizen-cli.sh install (에뮬레이터/실기기)
  → tizen-cli.sh run (앱 실행)
```

## 9. 기존 버전과의 차이점

| 항목 | 기존 (Backend + Frontend) | Frontend Only |
|------|--------------------------|---------------|
| 서버 | NestJS 백엔드 필요 | 서버 불필요 (정적 파일) |
| Gemini API | 백엔드에서 호출 | 브라우저에서 직접 호출 |
| Places API | 백엔드 프록시 경유 | 브라우저에서 직접 호출 |
| 항공편/호텔 | Amadeus API (실제) | Mock 데이터 |
| 결제 | 백엔드 Express 서버 | Cloudflare Worker |
| 상태 동기화 | WebSocket (socket.io) | HTTP 폴링 (2초) |
| 배포 | 백엔드 + 프론트엔드 | .wgt 파일 + Worker |
| API 키 보안 | 서버 환경변수 | 클라이언트 빌드에 포함 (주의) |

### 9.1 보안 고려사항

- Google API 키: 빌드 시 번들에 포함됨 → API 키에 HTTP referrer 제한 설정 권장
- Toss 시크릿 키: Worker 환경변수에만 저장 (클라이언트 노출 없음)
- CORS: Worker에서 `Access-Control-Allow-Origin: *` 설정 (프로덕션에서는 제한 필요)
