# Changelog

## 2026-03-16 — UI 개선 및 API 키 업데이트

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `Services/ApiConfig.cs` | Gemini API 키 교체, Payment URL 수정 |
| `Components/AttractionCard.cs` | 별점(Rating) 표시 제거 |
| `Components/LoadingSpinner.cs` | 로딩 애니메이션 전면 교체 |

### 상세 내용

#### 1. Gemini API 키 만료 대응 (`ApiConfig.cs`)

- **문제**: 기존 Gemini API 키가 만료되어 DestinationPage 관광지 설명이 표시되지 않음 (Places API는 정상이라 이름/별점/사진은 출력되었으나 한국어 설명만 빈 문자열)
- **진단**: `curl`로 API 직접 호출하여 `400 API_KEY_INVALID` 확인
- **수정**: 새 Gemini API 키로 교체

#### 2. Payment URL 수정 (`ApiConfig.cs`)

- **문제**: `http://10.0.2.2:3000` (Android 에뮬레이터 전용 localhost alias)으로 설정되어 Tizen TV 에뮬레이터에서 결제 서버 연결 실패 → "결제 세션 생성중..." 상태에서 멈춤
- **원인**: Android 에뮬레이터는 `10.0.2.2`로 호스트 접근 가능하나, Tizen 에뮬레이터는 해당 규칙이 없음
- **수정**: 호스트 PC의 LAN IP(`192.168.55.46:3000`)로 변경
- **참고**: frontend-only 버전(`tv-app-web`)은 `/api/server-info` 엔드포인트에서 LAN IP를 자동 감지하는 구조

#### 3. AttractionCard 별점 제거 (`AttractionCard.cs`)

- **변경 전**: 관광지명, ⭐ 별점, 한국어 설명 3줄 표시
- **변경 후**: 관광지명, 한국어 설명 2줄만 표시
- **이유**: 첫 번째 페이지에서 별점은 불필요, 설명에 더 많은 공간 할당
- **삭제 코드**: `_ratingLabel` 필드 및 `if (rating.HasValue) { ... }` 블록

#### 4. LoadingSpinner 전면 교체 (`LoadingSpinner.cs`)

- **문제 (v1)**: `BorderVisual`로 구현된 원형 스피너가 NUI에서 네모난 테두리로 렌더링됨
- **문제 (v2)**: `ArcVisualProperty` 사용 시도 → Tizen.NET API10에서 `internal` 접근 제한으로 컴파일 에러
- **문제 (v3)**: 원형 `View` + `BorderlineWidth`로 변경 → 완벽한 원이 회전해서 움직임이 보이지 않음 (`AnimateTo` 0→360° = 동일 위치)
- **최종 해결**: 점 3개 bouncing dots 애니메이션으로 전면 교체

**구현 방식**:
```
[●] [●] [●]  ← 3개의 원형 View (CornerRadius = size/2)
```
- 각 점이 200ms 간격으로 순차 활성화 (stagger animation)
- 활성: Opacity 0.3→1.0 + Scale 1.0→1.3 (300ms)
- 비활성: Opacity 1.0→0.3 + Scale 1.3→1.0 (300ms)
- 전체 사이클: 1200ms, 무한 반복 (`Looping = true`)
- Web App 버전의 로딩 인디케이터와 시각적 일관성 확보

### 빌드 및 테스트 환경

```
Platform:    Tizen TV Emulator (tv-samsung-10.0-x86_64, HD1080)
Build:       dotnet build -p:TizenSigningProfileName=tv-develop
Signing:     tv-develop profile (Tizen Studio Certificate Manager)
Deploy:      sdb install → tz run
Backend:     NestJS (tizen_travel_agent/backend) on localhost:3000
```

### 테스트 결과

| 항목 | 결과 |
|------|------|
| DestinationPage 관광지 로딩 스피너 | 점 3개 bouncing 애니메이션 정상 |
| DestinationPage 관광지 카드 | 이름 + 한국어 설명 표시 (별점 없음) |
| ItineraryPage 로딩 스피너 | 동일 bouncing dots 정상 |
| BookingPage QR 결제 | 백엔드 연결 후 QR 코드 생성 정상 |
