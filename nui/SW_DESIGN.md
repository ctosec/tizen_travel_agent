# Software Design Document - Travel Agent (NUI Version)

## 1. 개요

본 문서는 Samsung Tizen Smart TV용 AI 여행 에이전트 앱의 .NET NUI 네이티브 버전 아키텍처를 기술합니다.
기존 React 웹 프론트엔드와 동일한 UI/UX를 Tizen NUI (Natural User Interface) C# 프레임워크로 구현합니다.

### 1.1 설계 목표

- 웹 버전(frontend-only)과 **픽셀 단위 일치**하는 UI 재현
- NUI 네이티브 렌더링으로 60fps TV 성능 최적화
- C#/.NET 단일 언어로 전체 앱 구현 (서비스 + UI)
- Tizen FocusManager 기반 D-pad 네비게이션

### 1.2 아키텍처 요약

```
┌─────────────────────────────────────────────┐
│            Tizen NUI App (.NET)              │
│                                             │
│  ┌──────────┐  ┌──────┐  ┌──────────────┐  │
│  │ Services │  │ App  │  │    Pages     │  │
│  │(HTTP/API)│←→│(State)│←→│  (NUI View)  │  │
│  └────┬─────┘  └──────┘  └──────────────┘  │
│       │                                     │
└───────┼─────────────────────────────────────┘
        │
        ├──→ Google Gemini REST API
        ├──→ Google Places REST API
        ├──→ Mock Data (in-memory)
        └──→ Cloudflare Worker (Toss Payment)
```

## 2. 클래스 구조

### 2.1 App 클래스 (`App.cs`)

NUIApplication을 상속하며 앱의 중심 역할을 합니다.

```
App : NUIApplication
├── Properties (Shared State)
│   ├── City, Country, AirportCode
│   ├── TravelerData
│   ├── ItineraryDays, Duration, StartDate
│   ├── SelectedFlight, SelectedHotel
│
├── Methods
│   ├── NavigateTo(PageType) → 페이지 전환
│   ├── GoBack() → 이전 페이지
│   ├── SetDestination(city, country)
│   └── OnKeyEvent() → Escape/XF86Back 처리
│
└── PageType enum
    ├── Destination
    ├── Itinerary
    ├── Traveler
    └── Booking
```

**페이지 전환 방식**: 현재 페이지 View를 제거하고 새 페이지 View를 생성하여 추가합니다.
React의 MemoryRouter와 동일한 역할을 수행합니다.

### 2.2 상태 관리

React의 Zustand 6개 스토어 대신, App 클래스의 프로퍼티로 통합 관리합니다.

| Zustand Store | NUI 대응 | 위치 |
|---------------|----------|------|
| travelConfigStore | App.City/Country/AirportCode | App.cs |
| destinationStore | DestinationService 캐시 | Service 내부 |
| itineraryStore | App.ItineraryDays/Duration/StartDate | App.cs |
| travelerStore | App.TravelerData | App.cs |
| bookingStore | BookingPage 로컬 상태 | Page 내부 |
| paymentStore | BookingPage 로컬 상태 | Page 내부 |

## 3. 서비스 계층 설계

### 3.1 HTTP 통신

모든 서비스는 `System.Net.Http.HttpClient`를 사용합니다 (공유 static 인스턴스).

### 3.2 GeminiService

```
GeminiService (static)
├── GenerateText(prompt) → string
│   POST {baseUrl}/v1beta/models/gemini-2.5-flash:generateContent
│   Body: {"contents":[{"parts":[{"text": prompt}]}]}
│   Parse: candidates[0].content.parts[0].text
│
└── GenerateJson<T>(prompt) → T
    GenerateText + System.Text.Json.Deserialize<T>
```

### 3.3 PlacesService

```
PlacesService (static)
├── TextSearch(query, maxResults) → List<PlaceResult>
│   POST https://places.googleapis.com/v1/places:searchText
│   Headers: X-Goog-Api-Key, X-Goog-FieldMask
│   Body: {"textQuery", "languageCode": "ko", "maxResultCount"}
│
└── GetPhotoUrl(photoName, maxWidth) → string
    https://places.googleapis.com/v1/{name}/media?maxWidthPx=...&key=...
```

### 3.4 DestinationService / ItineraryService

웹 버전과 동일한 로직:
- Places 검색 → Gemini 한국어 설명 생성 → 결과 병합
- 10분 TTL 메모리 캐시
- 도시별 하드코딩 폴백 데이터

### 3.5 Mock 서비스

- MockFlightService: 5개 항공편 (랜덤 항공사/가격/경유)
- MockHotelService: 5개 호텔 (도시별 템플릿)

### 3.6 PaymentService

```
PaymentService (static)
├── CreateSession(orderId, amount, orderName, method) → PaymentSession
│   POST {PaymentUrl}/api/sessions
│
├── GetStatus(orderId) → PaymentSession
│   GET {PaymentUrl}/api/sessions/{orderId}/status
│
└── GetCheckoutUrl(orderId, amount, orderName, method) → string
    URL for QR code generation
```

## 4. UI 컴포넌트 설계

### 4.1 색상 시스템 (`AppColors.cs`)

60+ 정의된 Color 상수로 웹 Tailwind 색상과 정확히 일치합니다.

| 그룹 | 주요 색상 | 용도 |
|------|----------|------|
| Slate | #0f172a, #1e293b | 배경 |
| Blue | #3b82f6, #60a5fa | DestinationPage 포커스 |
| Purple | #a855f7, #c084fc | ItineraryPage/TravelerPage 포커스 |
| Indigo | #a5b4fc, #c7d2fe | 보조 텍스트 |
| Emerald | #10b981, #34d399 | 호텔/결제 성공 |
| Amber | #fbbf24 | 편집 모드/경고 |
| White/α | 0.05~0.50 | 반투명 배경/테두리 |

### 4.2 그라데이션 배경 (`GradientBackground.cs`)

NUI GradientVisual을 사용하여 페이지별 배경을 구현합니다.

```
Destination: slate-900 → blue-900 → slate-900 (135°)
Itinerary:   slate-900 → purple-900 → slate-900
Traveler:    slate-900 → purple-900 → slate-900
Booking:     slate-900 → indigo-900 → slate-900
```

### 4.3 FocusableButton

```
FocusableButton : View
├── Focusable = true
├── 내부 View (CornerRadius, BackgroundColor)
├── TextLabel (텍스트)
│
├── FocusGained → BorderlineWidth=4, Scale(1.05) 애니메이션
├── FocusLost → BorderlineWidth=0, Scale(1.0) 애니메이션
├── KeyEvent(Enter) → Clicked 이벤트 발생
│
└── SetGradientBackground(from, to) → 그라데이션 지원
```

### 4.4 FocusableInput

```
FocusableInput : View
├── TextLabel (라벨: Indigo300, 14pt)
├── TextField (입력: 52px 높이, 12px 라운드)
│
├── 모드 전환:
│   ├── 브라우징 → Enter → 편집 (border: amber)
│   └── 편집 → Escape → 브라우징 (border: purple)
│
└── ValueChanged 이벤트
```

### 4.5 카드 컴포넌트

| 컴포넌트 | 크기 | 포커스 효과 | 선택 상태 |
|----------|------|------------|----------|
| AttractionCard | 320×580 | Scale(1.1) + Blue ring-4 | N/A |
| ActivityCard | 가변×100~200 | Scale(1.05) + Purple ring-2 | N/A |
| FlightCard | 620×120 | Blue ring-2 | Blue bg+border |
| HotelCard | 620×130 | Emerald ring-2 | Emerald bg+border |

## 5. 페이지별 레이아웃

### 5.1 DestinationPage (1920×1080)

```
┌──────────────────────────────────────────┐
│ [80px padding]                            │
│                                          │
│  Title (60pt white)                      │ 80px
│  Subtitle (22pt blue-200)                │
│                                          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│  │Card │ │Card │ │Card │ │Card │ │Card ││ 580px
│  │320× │ │     │ │     │ │     │ │     ││
│  │580  │ │     │ │     │ │     │ │     ││
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘│
│                        gap: 24px         │
│                                          │
│                    [Make a Trip →] button │ 60px
│                                          │
└──────────────────────────────────────────┘
```

### 5.2 ItineraryPage (1920×1080)

```
┌──────────────────────────────────────────┐
│ [80px L/R, 50px T, 40px B padding]       │
│                                          │
│  Title + Controls (Date/Duration/Regen)  │ 60px
│                                          │
│  ┌──────┬──────┬──────┬──────┬──────┐    │
│  │Day 1 │Day 2 │Day 3 │Day 4 │Day 5 │    │ 800px
│  │      │      │      │      │      │    │ (carousel)
│  │Cards │Cards │Cards │Cards │Cards │    │
│  │      │      │      │      │      │    │
│  └──────┴──────┴──────┴──────┴──────┘    │
│          5 columns, 20% each             │
│                                          │
│  ● ○ ○   [항공편 & 호텔 예약 →]          │ 60px
│                                          │
└──────────────────────────────────────────┘
```

### 5.3 TravelerPage (1920×1080)

```
┌──────────────────────────────────────────┐
│  Title + Subtitle                        │
│                                          │
│  ┌──────────┬──────────┬──────────┐      │
│  │ 성       │ 이름     │ 이메일   │      │
│  ├──────────┼──────────┼──────────┤      │
│  │ 전화번호 │ 생년월일 │ 성별     │      │ 3×3+ grid
│  ├──────────┼──────────┼──────────┤      │ gap: 32×20
│  │ 국가코드 │ 여권번호 │ 여권만료 │      │
│  ├──────────┼──────────┼──────────┤      │
│  │ 국적     │          │          │      │
│  └──────────┴──────────┴──────────┘      │
│                                          │
│  [이전]              [항공편 & 호텔 선택 →]│
└──────────────────────────────────────────┘
```

### 5.4 BookingPage (1920×1080)

```
┌──────────────────────────────────────────┐
│  Title + Subtitle                        │
│                                          │
│  ┌──────────┬──────────┬──────────┐      │
│  │ ✈ 항공편 │ 🏨 호텔  │ 결제     │      │
│  │          │          │          │      │
│  │ Flight1  │ Hotel1   │ 가격요약 │      │
│  │ Flight2  │ Hotel2   │ ──────── │      │
│  │ Flight3  │ Hotel3   │ 합계     │      │
│  │ Flight4  │ Hotel4   │          │      │
│  │ Flight5  │ Hotel5   │ 결제수단 │      │
│  │          │          │ ○카카오  │      │
│  │          │          │ ○토스    │      │
│  │          │          │ ○삼성    │      │
│  │          │          │          │      │
│  │          │          │ [QR코드] │      │
│  │          │          │          │      │
│  └──────────┴──────────┴──────────┘      │
│   640px      640px      400px            │
└──────────────────────────────────────────┘
```

## 6. 네비게이션 시스템

### 6.1 페이지 전환

```csharp
App.NavigateTo(PageType)
  1. _rootView.Remove(_currentPage)
  2. _currentPage.Dispose()
  3. new XxxPage(this) 생성
  4. _rootView.Add(newPage)
```

### 6.2 포커스 관리

NUI의 `FocusManager.Instance`를 사용합니다.

```
FocusManager.Instance.SetCurrentFocusView(view)  // 프로그래밍 포커스
view.Focusable = true                             // 포커스 가능 설정
view.FocusGained += handler                       // 포커스 획득 이벤트
view.FocusLost += handler                         // 포커스 해제 이벤트
```

### 6.3 키 매핑

| 키 | NUI KeyPressedName | 동작 |
|----|-------------------|------|
| 방향키 | Left/Right/Up/Down | FocusManager 자동 이동 |
| Enter | Return / Enter | 선택/확인 |
| Escape | Escape | 이전 페이지 |
| Back | XF86Back | 이전 페이지 (Tizen 리모컨) |

## 7. 애니메이션

NUI `Animation` 클래스를 사용합니다.

| 대상 | 속성 | 값 | 시간 |
|------|------|-----|------|
| 카드 포커스 | Scale | 1.0 → 1.05~1.1 | 200~300ms |
| 버튼 포커스 | Scale | 1.0 → 1.05 | 200ms |
| 캐러셀 이동 | PositionX | translateX | 300ms |
| 로딩 스피너 | Orientation | 0° → 360° (loop) | 1000ms |

## 8. 웹 버전과의 비교

| 항목 | 웹 (React) | NUI (C#) |
|------|-----------|----------|
| 렌더링 | WebKit DOM | NUI DALi 렌더러 |
| 레이아웃 | CSS Flexbox/Grid | NUI LinearLayout/GridLayout |
| 스타일링 | Tailwind 유틸리티 | 프로그래밍 방식 (Color, Size) |
| 상태 관리 | Zustand (6 store) | App 클래스 프로퍼티 |
| 라우팅 | react-router-dom | App.NavigateTo() |
| HTTP | fetch / SDK | HttpClient |
| 포커스 | norigin-spatial-navigation | NUI FocusManager |
| 애니메이션 | CSS transition | NUI Animation |
| QR 생성 | react-qr-code | (외부 라이브러리 또는 서버 생성) |
| 패키징 | .wgt (웹앱) | .tpk (네이티브앱) |
| 성능 | WebKit 렌더링 | 네이티브 GPU 렌더링 |

## 9. 제한사항 및 향후 개선

- **QR 코드**: NUI에 내장 QR 생성 기능 없음 → 서버사이드 QR 이미지 또는 NuGet 패키지 필요
- **그라데이션**: NUI GradientVisual은 CSS gradient-to-br (대각선)과 완벽히 동일하지 않을 수 있음
- **백드롭 블러**: NUI에서 backdrop-blur-sm과 동일한 효과를 내기 어려움 → 반투명 배경으로 대체
- **폰트**: 시스템 폰트 사용 (SamsungOneUI 우선, 미설치 시 기본 폰트)
- **이미지 로딩**: NUI ImageView는 URL 직접 로딩 지원하나 캐싱 전략이 다름
