# 04_BUGFIX_SPEC.md

버그 수정 명세 — 2026-05-18

---

## BUG-01: SearchPage 할인 토글 미표시

### 증상
위치 권한을 허용하지 않은 상태에서 검색 결과 페이지(`/search`)에 진입하면
할인만 보기 토글이 표시되지 않음.

### 원인
`DiscountToggle`이 `Home.tsx`에서는 `!locError` 조건부로 렌더링되었으나,
`SearchPage.tsx`에는 아예 포함되어 있지 않았음.
검색 결과에도 할인 필터가 필요하므로 SearchPage에 독립적으로 추가해야 함.

### 수정 내용

**`src/pages/SearchPage.tsx`**
- 로컬 `discountOnly` state + `handleToggle` 추가 (전역 filterStore와 별개)
- `Header`에 `discountOnly` / `onToggleDiscount` props 전달 → desktop 토글 표시
- mobile 필터 바(`lg:hidden`) 추가 — `DiscountToggle` 포함
- 이벤트 필터링: `discountOnly === true`이면 `events.filter(e => e.discount !== null)` 적용

---

## BUG-02: 검색 결과 상세 페이지 "존재하지 않는 공연" 오류

### 증상
`/search?q=...` 검색 결과 목록에서 카드 클릭 시 `/detail/:id`로 이동하면
"존재하지 않는 공연입니다." 메시지가 표시됨.

### 원인
`Detail.tsx`가 `id` 파라미터로 API를 재조회하는 방식이었으나,
API가 seq 단일 조회를 지원하지 않아 검색 키워드로 호출한 후 seq를 매칭했음.
검색 없이 seq만으로 호출하면 빈 결과가 반환되어 notFound 처리됨.

### 수정 내용

**`src/components/EventCard.tsx`**
- `navigate(\`/detail/${event.id}\`, { state: { event } })` — 이벤트 객체를 navigation state로 전달

**`src/pages/Detail.tsx`**
- `location.state?.event` 우선 사용: state에 이벤트 객체가 있으면 API 호출 없이 즉시 렌더링
- state 없을 때(직접 URL 접근)만 API fallback 실행:
  `fetchCultureInfoArea({ keyword: id })`로 호출 후 `items.find(item => item.seq === id)`로 매칭
- `useEvents()` hook 의존성 제거, `fetchCultureInfoArea` / `fetchTicketDiscounts` 직접 호출

---

## 영향 범위

| 파일 | 변경 유형 |
|---|---|
| `src/pages/SearchPage.tsx` | 기능 추가 (할인 필터) |
| `src/components/EventCard.tsx` | 수정 (navigate state 추가) |
| `src/pages/Detail.tsx` | 수정 (state-first 조회 + API fallback) |
