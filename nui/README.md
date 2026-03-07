# Travel Agent - Tizen NUI Version

Samsung Tizen Smart TV용 AI 여행 에이전트 앱의 .NET NUI (Natural User Interface) 버전입니다.
기존 React 웹 프론트엔드와 동일한 UI/UX를 C#/.NET NUI 네이티브 프레임워크로 구현합니다.

## 주요 기능

- **AI 여행 일정 생성** - Google Gemini 2.5-flash API (REST)
- **실시간 관광지 검색** - Google Places API (New)
- **항공편/호텔 검색** - Mock 데이터 (Amadeus API 형식 호환)
- **QR 코드 결제** - Toss Payments SDK via Cloudflare Worker
- **TV 리모컨 최적화** - NUI FocusManager 기반 D-pad 네비게이션
- **1920x1080 고정 디자인** - 모든 TV 해상도에서 일관된 레이아웃

## 페이지 흐름

```
DestinationPage → ItineraryPage → TravelerPage → BookingPage
  (관광지 탐색)    (AI 일정 생성)   (여행자 정보)   (항공/호텔/결제)
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| Platform | Tizen .NET (NUI) |
| Language | C# |
| UI Framework | Tizen.NUI 10.0 |
| JSON | System.Text.Json |
| AI | Google Gemini REST API |
| 지도/사진 | Google Places API (New) REST |
| 결제 | Toss Payments via Cloudflare Worker |
| HTTP | System.Net.Http.HttpClient |

## 프로젝트 구조

```
nui/
├── TravelAgent.sln
└── TravelAgent/
    ├── TravelAgent.csproj        # .NET Tizen 프로젝트
    ├── tizen-manifest.xml        # Tizen 앱 매니페스트
    ├── Program.cs                # 진입점
    ├── App.cs                    # NUIApplication + 네비게이션 + 상태
    ├── Pages/
    │   ├── DestinationPage.cs    # 관광지 카드 캐러셀
    │   ├── ItineraryPage.cs      # AI 일정 캐러셀 + 날짜/기간 조절
    │   ├── TravelerPage.cs       # 여행자 정보 입력 폼
    │   └── BookingPage.cs        # 항공편/호텔 선택 + QR 결제
    ├── Components/
    │   ├── GradientBackground.cs # 페이지별 그라데이션 배경
    │   ├── FocusableButton.cs    # 포커스 가능 버튼 (스케일 애니메이션)
    │   ├── FocusableInput.cs     # TV 최적화 텍스트 입력
    │   ├── AttractionCard.cs     # 관광지 카드 (사진 + 설명)
    │   ├── ActivityCard.cs       # 일정 활동 카드
    │   ├── FlightCard.cs         # 항공편 선택 카드
    │   ├── HotelCard.cs          # 호텔 선택 카드
    │   └── LoadingSpinner.cs     # 로딩 애니메이션
    ├── Services/
    │   ├── ApiConfig.cs          # API 키 설정
    │   ├── GeminiService.cs      # Gemini REST API 클라이언트
    │   ├── PlacesService.cs      # Google Places API 클라이언트
    │   ├── DestinationService.cs # 관광지 데이터 오케스트레이터
    │   ├── ItineraryService.cs   # AI 일정 생성 + 폴백
    │   ├── MockFlightService.cs  # 모의 항공편 데이터
    │   ├── MockHotelService.cs   # 모의 호텔 데이터
    │   └── PaymentService.cs     # Toss 결제 Worker 클라이언트
    ├── Models/
    │   ├── Destination.cs        # 관광지 데이터 모델
    │   ├── Itinerary.cs          # 일정 데이터 모델
    │   └── Booking.cs            # 예약/결제 데이터 모델
    ├── Utils/
    │   ├── AppColors.cs          # 전체 색상 팔레트 (60+ 색상)
    │   ├── Currency.cs           # 환율 변환 (EUR/USD/GBP/JPY → KRW)
    │   └── AirportCodes.cs       # 도시 ↔ 공항 코드 매핑
    └── res/                      # 리소스 (아이콘 등)
```

## 빌드 및 실행

### 사전 요구사항

- Tizen Studio (with .NET extension)
- .NET 6.0+ SDK
- Tizen .NET SDK

### 빌드

```bash
dotnet build TravelAgent.sln
```

### Tizen 패키징 및 배포

```bash
# TPK 패키징
tizen package -t tpk -- TravelAgent/bin/Release/tizen10.0/

# 에뮬레이터 설치
tizen install -n TravelAgent-1.0.0.tpk -s <device-serial>

# 실행
tizen run -p com.travelagent.nui -s <device-serial>
```

## API 설정

`Services/ApiConfig.cs`에서 API 키를 설정합니다:

```csharp
public static string GeminiApiKey = "your_gemini_api_key";
public static string GooglePlacesApiKey = "your_google_places_api_key";
public static string PaymentUrl = "https://your-toss-worker.workers.dev";
```

## 키보드/리모컨 조작

| 키 | 동작 |
|----|------|
| 방향키 (상하좌우) | 포커스 이동 |
| Enter | 선택/확인 |
| Escape / XF86Back | 이전 페이지로 돌아가기 |

## 웹 버전과의 대응관계

| 웹 (React) | NUI (C#) |
|------------|----------|
| React Component | NUI View (class) |
| useState / Zustand | App 클래스 프로퍼티 |
| useEffect | OnCreate / async Task |
| CSS Tailwind | AppColors + 프로그래밍 방식 스타일링 |
| MemoryRouter | App.NavigateTo() |
| useFocusable | NUI FocusManager + Focusable 프로퍼티 |
| CSS transition | NUI Animation |
| fetch / SDK | HttpClient |
