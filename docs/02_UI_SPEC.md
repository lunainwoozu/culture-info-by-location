# 02_UI_SPEC.md — UI 구현 명세

**작성일**: 2026-05-18  
컴포넌트·페이지의 props, 상태 연결, 인터랙션, 레이아웃을 기술한다.

---

## 1. 전체 레이아웃

### 반응형 브레이크포인트

| 범위 | 레이아웃 |
|---|---|
| 375px ~ 639px (mobile) | 단일 컬럼, 전폭 카드 |
| 640px ~ 1023px (tablet) | 2열 카드 그리드 |
| 1024px ~ 1200px+ (desktop) | 3열 카드 그리드, 사이드 필터 |

### 공통 구조

```
┌──────────────────────────────────────────┐
│ Header (sticky, 전폭)                    │
│  로고        SearchBar        [필터 토글] │  ← desktop: 헤더 내 필터
├──────────────────────────────────────────┤
│              max-w-screen-xl 컨테이너     │
│  [mobile]  단일 컬럼 카드 리스트         │
│  [tablet]  ┌───────┐ ┌───────┐           │
│            │ card  │ │ card  │           │
│  [desktop] ┌─────┐ ┌─────┐ ┌─────┐      │
│            │card │ │card │ │card │      │
└──────────────────────────────────────────┘
```

컨테이너: `max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8`

---

## 2. 공통 컴포넌트

### Header

- **위치**: `src/components/Header.tsx`
- **역할**: sticky 상단 헤더
- **props**: `discountOnly?: boolean`, `onToggleDiscount?: () => void`
- **인터랙션**
  - 로고 클릭 → `/` 이동
  - SearchBar에서 검색 → `/search?q={keyword}` 이동
  - desktop: 필터 토글 버튼을 헤더 우측에 표시

```
[mobile]
┌──────────────────────────────────┐
│ 🎭 오늘 문화일정  [🔍_____________]│
└──────────────────────────────────┘

[desktop]
┌──────────────────────────────────────────────────────┐
│ 🎭 오늘 문화일정    [🔍___________]  할인만 보기 [○──] │
└──────────────────────────────────────────────────────┘
```

---

### SearchBar

- **위치**: `src/components/SearchBar.tsx`
- **props**: `defaultValue?: string`, `onSearch: (keyword: string) => void`
- **인터랙션**
  - Enter 또는 검색 버튼 클릭 → `onSearch(keyword)` 호출
  - 입력값 비어있으면 검색 무시

---

### EventCard

- **위치**: `src/components/EventCard.tsx`
- **props**: `event: Event`
- **인터랙션**: 카드 전체 클릭 → `/detail/{id}` 이동
- **레이아웃** — 좌우 2분할 구조

```
┌─────────────────────────────────────────┐
│ ┌──────────┐  공연명 (bold, 2줄 말줄임) │
│ │          │  공연장 · 거리             │
│ │ 썸네일   │  날짜 범위                 │
│ │          │                           │
│ │ [할인뱃지]│  [분야 태그]              │
│ └──────────┘                           │
└─────────────────────────────────────────┘
```

- **좌측**: 썸네일 이미지 (고정 너비 96px, 카드 전체 높이만큼 세로 확장)
  - 없으면 회색 배경 + 이미지 아이콘 placeholder
  - 할인 뱃지: 썸네일 좌하단 오버레이 (`absolute bottom-1 left-1`)
- **우측**: 텍스트 영역 (flex column, space-between)
  - 상단: 공연명(bold, 최대 2줄), 공연장·거리(gray-500), 날짜 범위(gray-500)
  - 하단: 분야 태그 (gray-100 배경 pill)
- 거리: `formatDistance()` 적용 (예: `1.2km`, `800m`)
- 날짜: `startDate ~ endDate` (같은 날이면 하나만 표시)

---

### DiscountBadge

- **위치**: `src/components/DiscountBadge.tsx`
- **props**: `discountRate: number`
- **출력**: `20% 할인` — teal-500 배경 흰 텍스트 뱃지

### DiscountToggle

- **위치**: `src/components/DiscountToggle.tsx`
- **props**: `checked: boolean`, `onChange: () => void`
- **형태**: 슬라이딩 토글 스위치 (iOS 스타일)

```
off: [○──────]  배경 gray-200,  원형 핸들 white, 왼쪽
on:  [──────●]  배경 teal-500,  원형 핸들 white, 오른쪽
```

- `할인만 보기` 레이블 + 토글 스위치 한 쌍으로 구성
- 전환 시 `transition-all duration-200` 애니메이션

---

### SkeletonCard

- **위치**: `src/components/SkeletonCard.tsx`
- **props**: 없음
- **역할**: EventCard 로딩 중 pulse 애니메이션 placeholder
- EventCard와 동일한 높이·레이아웃, 회색 블록으로 채움

---

### Pagination

- **위치**: `src/components/Pagination.tsx`
- **props**: `total: number`, `page: number`, `pageSize: number`, `onChange: (page: number) => void`
- **레이아웃**: 이전 / 1 2 3 ... / 다음 버튼
- 현재 페이지는 인디고 배경으로 강조
- 최대 5개 페이지 번호 표시 (슬라이딩 윈도우)

---

### ErrorMessage

- **위치**: `src/components/ErrorMessage.tsx`
- **props**: `message: string`, `onRetry?: () => void`
- `onRetry` 있으면 "다시 시도" 버튼 표시, 없으면 버튼 미표시

---

## 3. 페이지

### Home (`/`)

- **파일**: `src/pages/Home.tsx`
- **상태 연결**
  - `useGeolocation()` — 마운트 시 위치 수집 시작
  - `useLocationStore()` — lat, lng, loading, error
  - `useEvents()` — events, loading, error, refetch
  - `useFilterStore()` — discountOnly, toggleDiscountOnly

- **렌더링 분기**

```
locationStore.loading  → SkeletonCard × 6
locationStore.error    → ErrorMessage (재시도 버튼 없음, 권한 안내)
events.loading         → SkeletonCard × 6
events.error           → ErrorMessage + 재시도 버튼
정상                   → 필터 토글 + 카드 그리드 + Pagination
```

- **필터 토글**: DiscountToggle 컴포넌트
  - `discountOnly=true` → `events.filter(e => e.discount !== null)`
  - mobile: 헤더 아래 별도 바 (`py-2 px-4 border-b`)에 위치
  - desktop: 헤더 우측에 인라인으로 위치
- **카드 그리드**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- **페이지네이션**: 페이지당 20건 (그리드 기준), 클라이언트 슬라이싱

---

### SearchPage (`/search?q=`)

- **파일**: `src/pages/SearchPage.tsx`
- **상태 연결**
  - URL `q` 파라미터로 keyword 읽기 (`useSearchParams`)
  - `useEvents(keyword)` — keyword 전달
  - `useLocationStore()` — 위치 없으면 위치 요청 안내

- **렌더링 분기**

```
loading  → SkeletonCard × 6
error    → ErrorMessage + 재시도 버튼
결과 없음 → "'{keyword}'에 대한 검색 결과가 없습니다."
정상     → EventCard 리스트 + Pagination
```

- **헤더**: SearchBar에 현재 keyword 기본값으로 표시
- **뒤로가기**: 헤더 좌측 `←` 버튼 → `navigate(-1)`

---

### Detail (`/detail/:id`)

- **파일**: `src/pages/Detail.tsx`
- **상태 연결**
  - `useParams()` — id (seq)
  - `useEvents()`로 로드된 events에서 id로 단건 탐색
  - 없으면 API `/area2?keyword={id}` 재조회 (직접 URL 접근 대응)

- **렌더링 분기**

```
loading    → 스켈레톤 (상세 레이아웃)
not found  → "존재하지 않는 공연입니다." + 홈으로 버튼
정상       → 상세 정보
```

- **레이아웃**

```
┌──────────────────────────────┐
│ ← 뒤로가기                   │
│ [포스터 이미지 (전폭)]        │
│ 공연명                [할인뱃지]│
│ 공연장                       │
│ 📅 날짜 범위                 │
│ 🎭 분야                      │
│ 💰 가격 정보                 │
│                              │
│ [예매하기 →] (외부 링크 버튼)│
└──────────────────────────────┘
```

- **예매 링크**: `https://www.culture.go.kr/공연상세URL` 새 탭으로 이동
  - 실제 URL 패턴은 API 상세 조회(`/detail2`)로 확인 필요
  - 없으면 버튼 미표시

---

## 4. 디자인 토큰

| 항목 | 값 |
|---|---|
| 주 색상 | `teal-500` (#14b8a6) |
| 주 색상 hover | `teal-600` (#0d9488) |
| 배경 | `white` / `gray-50` |
| 텍스트 기본 | `gray-900` |
| 텍스트 보조 | `gray-500` |
| 카드 테두리 | `gray-100` |
| 할인 뱃지 | `teal-500` 배경, 흰 텍스트 |
| 분야 태그 | `gray-100` 배경, `gray-600` 텍스트 |
| 폰트 크기 | Tailwind 기본 (`text-sm`, `text-base`, `text-lg`) |

---

## 5. 구현 순서

| 순서 | 파일 |
|---|---|
| 1 | `DiscountBadge.tsx` |
| 2 | `DiscountToggle.tsx` |
| 3 | `SkeletonCard.tsx` |
| 4 | `ErrorMessage.tsx` |
| 5 | `EventCard.tsx` |
| 6 | `Pagination.tsx` |
| 7 | `SearchBar.tsx` |
| 8 | `Header.tsx` |
| 9 | `Home.tsx` |
| 10 | `SearchPage.tsx` |
| 11 | `Detail.tsx` |
