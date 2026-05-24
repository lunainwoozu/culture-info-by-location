# 03_KEYWORD_SEARCH_SPEC.md — 위치 없이 지역·공연명 검색

**작성일**: 2026-05-18  
위치 권한 없이도 지역명(예: 여의도)이나 공연명으로 검색할 수 있도록 하는 기능 명세.

---

## 1. 문제 정의

현재 홈 화면은 GPS 위치가 없으면 에러 메시지만 표시하고 끝남.  
사용자가 위치를 허용하지 않더라도 검색창에 "여의도", "뮤지컬" 등을 입력해 결과를 볼 수 있어야 함.

---

## 2. API 동작 확인

`/area2` 엔드포인트는 바운딩 박스 파라미터(`gpsxfrom` 등) 없이 `keyword`만으로도 호출 가능.  
→ 위치 없을 때 `keyword`만 전달하면 해당 키워드가 포함된 전국 공연·전시 결과 반환.

---

## 3. 변경 범위

### 3-1. 타입 변경 (`src/types/api.ts`)

`Event.distanceKm`, `Event.lat`, `Event.lng`를 `number | null`로 변경.  
위치 없이 키워드 검색 시 좌표·거리를 알 수 없으므로 `null` 처리.

```ts
// 변경 전
distanceKm: number
lat: number
lng: number

// 변경 후
distanceKm: number | null  // null이면 거리 미표시
lat: number | null
lng: number | null
```

### 3-2. API 함수 (`src/api/cultureInfo.ts`)

바운딩 박스 파라미터를 optional로 변경.  
전달되지 않으면 좌표 파라미터 없이 keyword만으로 호출.

```ts
interface AreaParams {
  lngMin?: number   // optional
  lngMax?: number
  latMin?: number
  latMax?: number
  keyword?: string
  pageNo?: number
  numOfRows?: number
}
```

### 3-3. 훅 변경 (`src/hooks/useEvents.ts`)

**위치 있을 때 (기존)**
- 바운딩 박스 계산 → API 호출 → 거리 계산 → 10km 필터 → 거리순 정렬

**위치 없을 때 (신규)**
- keyword만으로 API 호출 (바운딩 박스 없음)
- `distanceKm: null`, `lat: null`, `lng: null`
- 날짜 오름차순(startDate) 정렬
- 10km 필터 없음 (전국 결과)

### 3-4. 홈 화면 (`src/pages/Home.tsx`)

위치 에러 상태일 때 기존 에러 메시지만 표시하는 대신,  
검색 유도 UI를 함께 표시.

```
┌─────────────────────────────────┐
│  📍 위치를 확인할 수 없습니다.  │
│     브라우저에서 위치 접근을    │
│     허용하거나,                 │
│                                 │
│  [🔍 지역·공연명으로 검색하기]  │  ← SearchBar 크게 표시
└─────────────────────────────────┘
```

### 3-5. 검색 결과 화면 (`src/pages/SearchPage.tsx`)

- 위치 없어도 검색 결과 표시 가능 (기존에는 위치 에러 시 빈 화면)
- 거리 정보가 없는 경우 카드에서 거리 부분 숨김
- 결과 없음 처리는 기존과 동일

### 3-6. EventCard (`src/components/EventCard.tsx`)

`distanceKm`이 `null`이면 거리 텍스트를 렌더링하지 않음.

```
// distanceKm 있을 때
{event.place} · {formatDistance(event.distanceKm)}

// distanceKm null일 때
{event.place}
```

---

## 4. 정렬 기준

| 상황 | 정렬 |
|---|---|
| 위치 있음 | 거리 오름차순 |
| 위치 없음 (키워드 검색) | startDate 오름차순 |

---

## 5. 구현 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/types/api.ts` | `distanceKm`, `lat`, `lng` → `number \| null` |
| `src/api/cultureInfo.ts` | 바운딩 박스 파라미터 optional 처리 |
| `src/hooks/useEvents.ts` | 위치 없을 때 keyword-only 분기 추가 |
| `src/components/EventCard.tsx` | `distanceKm === null`이면 거리 미표시 |
| `src/pages/Home.tsx` | 위치 에러 시 검색 유도 UI 추가 |
| `src/pages/SearchPage.tsx` | 위치 없이도 검색 결과 표시 |
