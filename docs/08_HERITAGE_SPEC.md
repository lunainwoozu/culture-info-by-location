# 08_HERITAGE_SPEC.md

문화재 연동 — 국가유산청 API + Vercel Serverless Function 프록시

---

## 1. 배경 및 목적

"오늘 하루 문화 일정" 콘셉트에 공연·전시 외 문화재 탐방을 추가한다.
국가유산청 API는 CORS 차단으로 브라우저 직접 호출이 불가능하므로 Vercel Serverless Function을 프록시로 구성한다.

---

## 2. UI 구조

홈 화면에 문화재 섹션(위) → 공연·전시 섹션(아래) 순으로 배치한다.

```
헤더 (검색바, 할인 필터)
──────────────────────────
🏛 문화재
  HeritageCard × N
──────────────────────────
📍 공연·전시
  EventCard × N
```

### 위치 권한 없을 때 (C안)

각 섹션 상단에 안내 문구 한 줄을 표시하고, 고정 샘플 5개를 보여준다.
거리 표시 자리는 "—"로 표시한다.

```
🏛 문화재
  📍 내 위치를 허용하면 가까운 순으로 정렬됩니다.
  [경복궁 —] [창덕궁 —] [덕수궁 —] [종묘 —] [남산골한옥마을 —]

📍 공연·전시
  📍 내 위치를 허용하면 가까운 순으로 정렬됩니다.
  샘플 이벤트 카드 5개 (고정 데이터)
```

- 샘플 데이터는 코드 내 상수로 관리 (`src/constants/sampleData.ts`)
- 위치 허용 후에는 실제 데이터로 교체되고 거리순 정렬

---

## 3. 샘플 데이터

### 문화재 샘플 5개 (`src/constants/sampleData.ts`)

서울 내 인지도 높은 국가지정 문화재 선정.

| 이름 | 위치 |
|---|---|
| 경복궁 | 종로구 |
| 창덕궁 | 종로구 |
| 덕수궁 | 중구 |
| 종묘 | 종로구 |
| 남산골한옥마을 | 중구 |

### 공연·전시 샘플 5개

기존 `useEvents` 훅이 위치 없을 때 샘플을 반환하도록 수정.
서울 주요 공연장 기준 고정 이벤트 5개.

---

## 4. API 연동

### 4-1. Vercel Serverless Function 프록시

**파일**: `src/app/api/heritage/route.ts`

클라이언트에서 `/api/heritage?type=list` 또는 `/api/heritage?type=detail&...` 형태로 호출한다.

```ts
// GET /api/heritage?type=list
// GET /api/heritage?type=detail&ccbaKdcd=11&ccbaAsno=00010000&ccbaCtcd=11
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const apiKey = process.env.HERITAGE_API_KEY

  if (type === 'list') { /* 서울 전체 목록 호출 */ }
  if (type === 'detail') { /* 상세 호출 */ }
}
```

XML 응답을 서버에서 파싱 후 JSON으로 변환해 반환한다.

### 4-2. 목록 API (`/cha/SearchKindOpenapiList.do`)

| 파라미터 | 값 |
|---|---|
| `ccbaCtcd` | 11 (서울) |
| `pageUnit` | 20 |
| `pageIndex` | 1 |

응답 필드: `ccbaMnm1`(문화재명), `ccbaKdcd`, `ccbaAsno`, `ccbaCtcd`, `longitude`, `latitude`

### 4-3. 상세 API (`/cha/SearchKindOpenapiDt.do`)

| 파라미터 | 값 |
|---|---|
| `ccbaKdcd` | 종목코드 |
| `ccbaAsno` | 관리번호 |
| `ccbaCtcd` | 시도코드 |

응답 필드: `ccbaMnm1`, `longitude`, `latitude`, `content`(설명), `imageUrl`

---

## 5. 타입 정의 (`src/types/heritage.ts`)

```ts
interface HeritageItem {
  id: string          // `${ccbaKdcd}_${ccbaAsno}_${ccbaCtcd}`
  name: string        // ccbaMnm1
  ccbaKdcd: string
  ccbaAsno: string
  ccbaCtcd: string
  latitude: number
  longitude: number
  distanceKm: number | null
}

interface HeritageDetail extends HeritageItem {
  content: string
  imageUrl: string
}
```

---

## 6. API 함수 (`src/api/heritage.ts`)

```ts
// 목록 조회 — 서울 전체, 클라이언트에서 10km 필터 + 거리순 정렬
fetchHeritageList(): Promise<HeritageItem[]>

// 상세 조회
fetchHeritageDetail(ccbaKdcd: string, ccbaAsno: string, ccbaCtcd: string): Promise<HeritageDetail>
```

거리 계산은 기존 `src/utils/distance.ts`의 `haversineDistance` 재사용.

---

## 7. Custom Hook (`src/hooks/useHeritage.ts`)

```ts
function useHeritage(lat: number | null, lng: number | null): {
  items: HeritageItem[]
  loading: boolean
  error: string | null
  isSample: boolean   // 위치 없어 샘플 데이터 표시 중
}
```

- `lat`/`lng`가 null이면 `SAMPLE_HERITAGE`를 반환하고 `isSample: true`
- 위치 있으면 API 호출 후 10km 필터 + 거리순 정렬, `isSample: false`

---

## 8. 헤더 위치 재요청 버튼

위치 권한이 없을 때 헤더 우측에 📍 아이콘 버튼을 표시한다. 위치가 있으면 숨긴다.

```
[🎭 오늘 하루 문화 일정] [검색창] [📍] [로그인]
                                   ↑
                         위치 권한 없을 때만 표시
```

### 동작

```ts
const handleRequestLocation = () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => locationStore.setLocation(pos.coords),  // 성공 → 실제 데이터 로드
    (err) => {
      if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
        // 영구 차단 → 안내 메시지
        alert('위치 권한이 차단되어 있습니다. 브라우저 설정에서 허용해 주세요.')
      }
    }
  )
}
```

### 분기

| 상황 | 결과 |
|---|---|
| 처음 요청 또는 이번 세션에서 무시 | 브라우저 권한 팝업 재표시 |
| 브라우저에서 영구 차단 | "브라우저 설정에서 허용해 주세요" 안내 |
| 위치 허용 성공 | 샘플 → 실제 데이터로 교체, 버튼 숨김 |

**변경 파일**: `src/components/Header.tsx`

---

## 9. 컴포넌트

### HeritageCard (`src/components/HeritageCard.tsx`)

EventCard와 동일한 카드 레이아웃. 이미지 없으면 placeholder 표시.

```
┌──────────────┬──────────────────────┐
│              │ 경복궁               │
│   이미지     │ 종로구               │
│              │ 0.5km  (없으면 —)    │
└──────────────┴──────────────────────┘
```

### 상세 페이지 (`src/app/heritage/[id]/page.tsx`)

- `id` = `${ccbaKdcd}_${ccbaAsno}_${ccbaCtcd}`
- 상세 API 호출 후 문화재명, 설명, 이미지 표시
- 뒤로가기 버튼

---

## 9. 홈 화면 변경 (`src/app/page.tsx`)

```tsx
{/* 문화재 섹션 (위) */}
<section>
  <h2>🏛 문화재</h2>
  {isSample && <p>내 위치를 허용하면 가까운 순으로 정렬됩니다.</p>}
  {heritageItems.map((item) => <HeritageCard key={item.id} item={item} />)}
</section>

{/* 공연·전시 섹션 (아래) */}
<section>
  <h2>📍 공연·전시</h2>
  {isEventSample && <p>내 위치를 허용하면 가까운 순으로 정렬됩니다.</p>}
  {events.map((event) => <EventCard key={event.id} event={event} />)}
</section>
```

---

## 10. 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/app/api/heritage/route.ts` | 신규 — Vercel Serverless Function 프록시 |
| `src/types/heritage.ts` | 신규 — HeritageItem, HeritageDetail 타입 |
| `src/api/heritage.ts` | 신규 — 목록·상세 API 함수 |
| `src/hooks/useHeritage.ts` | 신규 — 문화재 데이터 훅 (샘플 fallback 포함) |
| `src/components/HeritageCard.tsx` | 신규 — 문화재 카드 컴포넌트 |
| `src/app/heritage/[id]/page.tsx` | 신규 — 문화재 상세 페이지 |
| `src/constants/sampleData.ts` | 신규 — 문화재·공연 샘플 고정 데이터 |
| `src/app/page.tsx` | 수정 — 섹션 순서 변경, 문화재 섹션 추가 |
| `src/hooks/useEvents.ts` | 수정 — 위치 없을 때 샘플 반환 |
| `src/components/Header.tsx` | 수정 — 위치 재요청 버튼 추가 (위치 없을 때만 표시) |
| `.env.local` | 수정 — `HERITAGE_API_KEY` 추가 |

---

## 11. 테스트 커버리지

| 테스트 | 파일 | 검증 내용 |
|---|---|---|
| 위치 없을 때 샘플 표시 | `tests/home.spec.ts` | 두 섹션 모두 샘플 카드 5개 + 안내 문구 표시 |
| 위치 허용 후 실제 데이터 전환 | `tests/home.spec.ts` | 안내 문구 사라짐, 거리값 표시 |
| 문화재 상세 페이지 | `tests/heritage.spec.ts` | 카드 클릭 → 문화재명·설명 표시 |
| API 오류 처리 | `tests/heritage.spec.ts` | 프록시 오류 시 에러 메시지 표시 |
