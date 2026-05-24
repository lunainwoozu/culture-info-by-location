# 09_FREE_BADGE_DISTANCE_SPEC.md

무료 배지 · Detail 거리 및 소요 시간 표시 — 2026-05-18

---

## 1. 배경 및 목적

실제 API 데이터에 무료 공연·전시가 다수 포함되어 있으나, 기존 UI에서는 할인 뱃지만 제공하고 무료 여부를 시각적으로 구분할 수 없었다. 또한 상세 페이지에 현재 위치로부터의 거리와 이동 소요 시간이 없어 사용자가 실제 방문 가능 여부를 직관적으로 판단하기 어려웠다.

이번 작업의 목표:
- 무료 공연·전시에 **초록 "무료" 뱃지** 표시 (카드 리스트 + 상세 페이지)
- 상세 페이지에 **현재 위치로부터의 거리** 표시
- 거리 기반 **도보 · 대중교통 소요 시간 추정** 제공

---

## 2. 무료 배지 (FreeBadge)

### 2-1. 컴포넌트

**파일**: `src/components/FreeBadge.tsx`

```tsx
export default function FreeBadge() {
  return (
    <span className="inline-block rounded px-1.5 py-0.5 text-xs font-semibold text-white bg-green-500">
      무료
    </span>
  )
}
```

- 색상: `bg-green-500` — 할인 뱃지(`bg-teal-500`)와 명확히 구분
- 크기·패딩: DiscountBadge와 동일 규격 유지

### 2-2. 무료 판단 기준

```ts
const isFree = Boolean(price) && (
  price.includes('무료') ||
  price === '0원'        ||
  price === '0'
)
```

- `price === ''` (빈 문자열, API 미제공): 무료 판단 안 함
- `price.includes('무료')`: "무료", "무료 입장", "무료(사전예약 필요)" 등 전부 커버
- `'0원'` / `'0'`: 명시적으로 0원인 경우 포함

### 2-3. EventCard에서의 표시

**파일**: `src/components/EventCard.tsx`

area2 API는 `price`를 반환하지 않으므로, 카드 마운트 시 `fetchCultureInfoDetail(event.id)`를 직접 호출해 price를 받아온다.

```ts
const [price, setPrice] = useState(event.price)  // 초기값: '' (빈 문자열)

useEffect(() => {
  if (price) return                               // 이미 price가 있으면 스킵
  let cancelled = false
  fetchCultureInfoDetail(event.id)
    .then((d) => { if (!cancelled && d?.price) setPrice(d.price) })
    .catch(() => {})
  return () => { cancelled = true }
}, [event.id, price])
```

**동작 흐름**:
1. 카드 렌더 시 `event.price === ''` → detail2 호출
2. 응답에서 price 수신 → `isFree` 재평가
3. 무료면 썸네일 좌하단에 FreeBadge 오버레이

**뱃지 공존 규칙**:

| 상태 | 표시 |
|---|---|
| 무료만 | FreeBadge |
| 할인만 | DiscountBadge |
| 무료 + 할인 | FreeBadge + DiscountBadge (세로 stack) |
| 둘 다 없음 | 없음 |

```tsx
{(isFree || event.discount) && (
  <div className="absolute bottom-1.5 left-1.5 flex flex-col gap-0.5">
    {isFree && <FreeBadge />}
    {event.discount && <DiscountBadge discountRate={event.discount.discountRate} />}
  </div>
)}
```

### 2-4. Detail 페이지에서의 표시

**파일**: `src/pages/Detail.tsx`

detail2 API 응답으로 받은 `event.price`를 직접 사용하므로 추가 호출 없이 즉시 판단 가능.

```ts
const isFree = Boolean(event.price) && (
  event.price.includes('무료') || event.price === '0원' || event.price === '0'
)
```

**중복 표시 방지**: `isFree === true`이면 price 행(MdLocalOffer)을 렌더하지 않음.
"무료"가 뱃지와 텍스트 두 곳에 동시에 나타나는 것을 막기 위함.

```ts
// isFree이면 priceText = null → price 행 미렌더
if (!isFree) {
  if (event.price) { priceText = event.price; ... }
  else if (event.discount) { ... }
}
```

---

## 3. 거리 및 소요 시간 (Detail 페이지)

### 3-1. 데이터 흐름

| 진입 방식 | distanceKm | 표시 여부 |
|---|---|---|
| EventCard 클릭 (state 전달) | 계산된 값 (≥0) | ✅ 표시 |
| URL 직접 접근 | `null` | 생략 |

EventCard → Detail 이동 시 `navigate('/detail/:id', { state: { event } })`로 event 객체 전달. `distanceKm`은 `useEvents`에서 Haversine 공식으로 이미 계산된 값이다.

### 3-2. formatTransitTime

**파일**: `src/utils/distance.ts`

외부 라우팅 API 없이 클라이언트에서 단순 계산. 실제 노선·환승·신호를 반영하지 않으므로 "약"으로 명시.

```ts
export function formatTransitTime(km: number): string {
  const walkMin = Math.ceil((km / 5) * 60)      // 도보: 시속 5km
  if (km < 0.5) return `도보 약 ${walkMin}분`
  const transitMin = Math.ceil((km / 25) * 60) + 10  // 대중교통: 시속 25km + 대기 10분
  return `도보 약 ${walkMin}분 · 대중교통 약 ${transitMin}분`
}
```

**구간별 출력 예시**:

| 거리 | 출력 |
|---|---|
| 200m (0.2km) | 도보 약 3분 |
| 500m (0.5km) | 도보 약 6분 · 대중교통 약 11분 |
| 3km | 도보 약 36분 · 대중교통 약 17분 |
| 8km | 도보 약 96분 · 대중교통 약 29분 |

> **한계**: 실제 경로, 환승, 신호, 언덕 미반영. 대중교통 환승 없는 직선 이동 기준 추정.

### 3-3. Detail UI 렌더링

```tsx
{event.distanceKm !== null && (
  <div className="flex items-start gap-3">
    <dt className="mt-0.5 shrink-0 text-gray-400">
      <MdDirectionsWalk size={18} />
    </dt>
    <dd className="text-gray-700 space-y-0.5">
      <span>현재 위치로부터 {formatDistance(event.distanceKm)}</span>
      <span className="block text-xs text-gray-500">
        {formatTransitTime(event.distanceKm)}
      </span>
    </dd>
  </div>
)}
```

---

## 4. 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/components/FreeBadge.tsx` | 신규 — green-500 "무료" 뱃지 |
| `src/components/EventCard.tsx` | `fetchCultureInfoDetail` 직접 호출, FreeBadge + DiscountBadge 공존 렌더 |
| `src/pages/Detail.tsx` | FreeBadge 표시, isFree 시 price 행 생략, 거리 + 소요시간 섹션 추가 |
| `src/utils/distance.ts` | `formatTransitTime(km)` 추가 |
| `tests/fixtures.ts` | `DETAIL_XML_FREE` 추가 (`<price>무료</price>`) |
| `tests/home.spec.ts` | detail2 mock 추가, FreeBadge 표시 테스트 추가 |
| `tests/detail.spec.ts` | FreeBadge 표시 테스트, 거리 표시 테스트 추가 |
| `tests/search.spec.ts` | detail2 mock 추가 |

---

## 5. 테스트 커버리지

| 테스트 | 파일 | 검증 내용 |
|---|---|---|
| 무료 공연에 FreeBadge 표시 | `home.spec.ts` | detail2 mock → price "무료" → 카드에 "무료" 뱃지 |
| 무료 공연 접근 시 FreeBadge 표시 | `detail.spec.ts` | Detail 페이지 상단 FreeBadge visible |
| state로 이동 시 Detail에 거리 표시 | `detail.spec.ts` | `distanceKm` 전달 → "현재 위치로부터" + "도보 약" 텍스트 visible |

전체 테스트: **14 passed** (Playwright, Chromium)
