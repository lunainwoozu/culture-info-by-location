# BUGFIX.md

버그 수정 및 소규모 개선 이력. 신규 버그·개선은 맨 위에 추가한다.

---

## 2026-05-18 — 소규모 개선: 무료 배지 + Detail 거리/소요시간

상세 명세: `docs/09_FREE_BADGE_DISTANCE_SPEC.md` → 이 파일로 통합

### 변경 내용

- `src/components/FreeBadge.tsx` 신규 — "무료" 배지 (green-500)
- `src/components/EventCard.tsx` — detail2 호출로 price 판단, FreeBadge + DiscountBadge 공존 렌더
- `src/pages/Detail.tsx` → (Next.js 이후) `src/app/detail/[id]/page.tsx`
  - FreeBadge 표시, isFree 시 price 행 생략
  - `distanceKm` 있을 때 거리 + 소요시간 표시
- `src/utils/distance.ts` — `formatTransitTime(km)` 추가

### 무료 판단 기준

```ts
const isFree = Boolean(price) && (
  price.includes('무료') || price === '0원' || price === '0'
)
```

`price === ''` (API 미제공)은 무료로 판단하지 않는다.

### 소요시간 계산

```ts
export function formatTransitTime(km: number): string {
  const walkMin = Math.ceil((km / 5) * 60)
  if (km < 0.5) return `도보 약 ${walkMin}분`
  const transitMin = Math.ceil((km / 25) * 60) + 10
  return `도보 약 ${walkMin}분 · 대중교통 약 ${transitMin}분`
}
```

도보 5km/h, 대중교통 25km/h + 대기 10분 기준. 실제 경로·환승 미반영.

---

## 2026-05-18 — 중복 카드 + HTML 엔티티 미디코딩

### BUG-03: 같은 카드 N장 중복 표시

**원인**: `from`/`to` 날짜 필터 추가 후 API가 `totalCount`를 필터 적용 전 건수로 반환 → 페이지 수 과대 계산 → 동일 아이템 반복 반환

**수정**: `fetchCultureInfoArea`에 두 가지 방어 로직 추가
1. 1페이지 결과 수 < `numOfRows`이면 조기 종료
2. 전체 결과 `seq` 기준 dedup

**변경 파일**: `src/api/cultureInfo.ts`

### BUG-04: 제목 내 HTML 엔티티 미디코딩 (`&lt;` 등)

**원인**: API XML 텍스트 필드가 HTML 엔티티 이중 인코딩. `DOMParser.textContent`는 1회만 디코딩.

**수정**: `parseItems`의 `t()` 헬퍼에 `textarea.innerHTML` 방식 2차 디코딩 추가

```ts
const decode = (s: string) => {
  const ta = document.createElement('textarea')
  ta.innerHTML = s
  return ta.value
}
```

**변경 파일**: `src/api/cultureInfo.ts`

---

## 2026-05-18 — SearchPage 할인 토글 + Detail state 버그

### BUG-01: SearchPage 할인 토글 미표시

**원인**: `DiscountToggle`이 `SearchPage`에 포함되어 있지 않았음

**수정**: `SearchPage`에 로컬 `discountOnly` state + mobile 필터 바 추가, `Header` props 연결

**변경 파일**: `src/pages/SearchPage.tsx`

### BUG-02: 검색 결과에서 상세 페이지 "존재하지 않는 공연" 오류

**원인**: `Detail.tsx`가 `id`로 API 재조회 시 검색 없이 seq만으로 호출 → 빈 결과

**수정**:
- `EventCard`: `navigate` 시 `{ state: { event } }` 전달
- `Detail`: `location.state?.event` 우선 사용, 없을 때만 API fallback

**변경 파일**: `src/components/EventCard.tsx`, `src/pages/Detail.tsx`
