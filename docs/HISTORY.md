# HISTORY.md

완료된 작업의 전체 이력을 담는다.

---

## 2026-05-18 (무료 배지 + Detail 거리/소요시간)

### 무료 배지 (FreeBadge) + Detail 거리/소요시간 표시

- `src/components/FreeBadge.tsx`: 신규 — green-500 "무료" 뱃지
- `src/components/EventCard.tsx`: `fetchCultureInfoDetail` 직접 호출 후 price 판단 → "무료"/"0원" 일 때 FreeBadge 오버레이, 할인 있으면 DiscountBadge 함께 표시
- `src/utils/distance.ts`: `formatTransitTime(km)` 추가 — 도보(5km/h), 대중교통(25km/h+대기10분) 소요시간 추정
- `src/pages/Detail.tsx`: FreeBadge 표시, 무료 시 price row 생략(중복 방지), `distanceKm` 있을 때 "현재 위치로부터 X" + `formatTransitTime` 표시
- `tests/fixtures.ts`: `DETAIL_XML_FREE` 추가
- `tests/home.spec.ts`, `tests/detail.spec.ts`, `tests/search.spec.ts`: detail2 mock 추가, 무료 배지/거리 테스트 추가 (14 tests 전체 통과)

---

## 2026-05-18 (Playwright 테스트)

### Playwright E2E 테스트 작성 및 전체 통과 (11/11)

- `package.json`: `@playwright/test` devDependency 추가, `test` 스크립트 (`npx playwright test --reporter=line`) 추가
- `playwright.config.ts`: Chromium 단일 프로젝트, `webServer` localhost:5173 기반, `reuseExistingServer` 설정
- `tests/fixtures.ts`: XML mock 상수 (area2 1건/2건/빈 값, detail2, ticketdiscounts 할인 있음/없음)
- `tests/home.spec.ts`: 위치 권한 거부 → LocationErrorPrompt, 위치 허용 → 카드 렌더링, 할인 필터 토글, 카드 클릭 → 상세 페이지 이동 (4 tests)
- `tests/detail.spec.ts`: 직접 URL 접근 → 이벤트 정보 표시, 존재하지 않는 seq → not-found 화면, 뒤로가기 버튼 → 이전 페이지 이동 (3 tests)
- `tests/search.spec.ts`: 검색 결과 헤딩 표시, 로딩 중 스켈레톤, 카드 렌더링 + 클릭, 할인 필터 토글 (4 tests)

---

## 2026-05-18 (버그 수정: 중복 카드 + HTML 엔티티)

참조: `docs/07_BUGFIX_SPEC.md`

- `src/api/cultureInfo.ts`
  - `decodeEntities` 함수 추가, `parseItems` `t()` 헬퍼에 적용 — API XML 이중 인코딩된 HTML 엔티티(`&lt;` 등) 2차 디코딩으로 제목 등 표시 정상화
  - `fetchCultureInfoArea` — `from`/`to` 날짜 필터 추가 이후 `totalCount`가 필터 적용 전 건수를 반환해 페이지 수 과대 계산 → 중복 카드 발생 문제 수정: page 1 결과 수 < `numOfRows`이면 조기 종료, 전체 결과 `seq` 기준 dedup

---

## 2026-05-18 (API 가이드 반영 + Detail 단일 로딩 UX 개선)

### API 가이드 반영 + Detail 페이지 단일 로딩 UX 개선

참조: `docs/06_API_GUIDE_UX_SPEC.md`

- `CLAUDE.md`: area2 엔드포인트 파라미터 보완; detail2 엔드포인트 신규 문서화(url·price·phone 등 전용 필드 명시); 할인티켓 API 역할 명확화(이벤트 생성 아닌 할인 매칭 전용) + detail 엔드포인트 참조 추가
- `src/types/api.ts`: `TicketDiscountItem`에서 미사용 필드(`seq`, `startDate`, `endDate`) 제거 — 실제 사용 필드(title·place·img·price·discountRate)만 유지
- `src/api/cultureTicket.ts`: parseItems를 사용 필드만 파싱하도록 정리
- `src/components/DetailSkeleton.tsx`: 신규 — Detail 페이지 레이아웃(sticky 헤더·포스터·정보·버튼)과 동일한 구조의 스켈레톤 컴포넌트
- `src/pages/Detail.tsx`: detailLoading 제거, 단일 loading 상태로 통합; stateEvent 유무와 무관하게 detail2 완료 후 한 번에 렌더; 인라인 DetailSkeleton → 컴포넌트 import로 교체

---

## 2026-05-18 (상세 페이지 재설계 + API 확장)

### 예매 링크 수정 + 날짜 범위 확장 + 가격 표시 + 상세 페이지 반응형

- `src/types/api.ts`: `CultureInfoItem`·`Event`에 `url`, `price` 필드 추가
- `src/api/cultureInfo.ts`: `url`·`price` XML 파싱 추가, `/area2`에 `from`/`to`(오늘~3개월) 파라미터 추가, `fetchCultureInfoDetail(seq)` 신규 추가 (`/detail2` 호출)
- `src/hooks/useEvents.ts`: `url`·`price` 빈 문자열로 매핑 (`/area2`에 해당 필드 없음 — 실제 값은 Detail 페이지에서 `/detail2`로 획득)
- `src/pages/Detail.tsx`: 항상 `fetchCultureInfoDetail` 호출 → `url`·`price` 획득 후 버튼 활성화, stateEvent 있으면 즉시 렌더 + 로딩 중 버튼 비활성, 모바일+데스크탑 2컬럼 반응형 레이아웃
- 참조: `docs/05_DETAIL_REDESIGN_SPEC.md`

---

## 2026-05-18 (버그 수정)

### BUG-01: SearchPage 할인 토글 미표시 수정

- `src/pages/SearchPage.tsx`: 로컬 discountOnly state + mobile 필터 바 + Header props 연결
- 위치 허용 여부와 무관하게 검색 결과에서도 할인 필터 사용 가능
- 참조: `docs/04_BUGFIX_SPEC.md`

### BUG-02: 검색 결과 상세 페이지 "존재하지 않는 공연" 오류 수정

- `src/components/EventCard.tsx`: navigate 시 `{ state: { event } }` 전달
- `src/pages/Detail.tsx`: location.state?.event 우선 사용, URL 직접 접근 시 API fallback
- 참조: `docs/04_BUGFIX_SPEC.md`

### 키워드 검색 (위치 없이 지역명/공연명으로 검색)

- `src/api/cultureInfo.ts`: bbox 파라미터 optional 처리, keyword-only 호출 지원
- `src/hooks/useEvents.ts`: 위치 없어도 keyword 있으면 API 호출, 거리 계산 skip
- `src/pages/SearchPage.tsx`: URL q 파라미터 → useEvents(keyword) 연결
- `src/router.tsx`: /search 라우트 추가
- `src/components/Header.tsx`: SearchBar 검색 시 /search?q= 이동
- 참조: `docs/03_KEYWORD_SEARCH_SPEC.md`

---

## 2026-05-18

### Phase 2 — 데이터 레이어 구현

- `src/types/api.ts`: CultureInfoItem, TicketDiscountItem, Event, DiscountInfo 타입 정의
- `src/utils/distance.ts`: haversineDistance, getBoundingBox, formatDistance
- `src/store/locationStore.ts`: 위치 상태 (lat, lng, loading, error)
- `src/store/filterStore.ts`: 필터 상태 (discountOnly, keyword)
- `src/api/cultureInfo.ts`: 문화정보 API 호출, XML 파싱, 멀티페이지 병렬 호출
- `src/api/cultureTicket.ts`: 할인티켓 API 호출, XML 파싱
- `src/hooks/useGeolocation.ts`: 위치 수집, 에러 코드별 메시지 분기
- `src/hooks/useEvents.ts`: 두 API 병렬 호출, 할인 매칭, 10km 필터, 거리순 정렬

### Phase 3 — UI 구현 (컴포넌트 + 페이지)

- `src/components/DiscountBadge.tsx`: teal-500 할인 뱃지
- `src/components/DiscountToggle.tsx`: iOS 스타일 슬라이딩 토글 스위치
- `src/components/SkeletonCard.tsx`: pulse 애니메이션 로딩 placeholder
- `src/components/ErrorMessage.tsx`: 에러 메시지 + 재시도 버튼
- `src/components/EventCard.tsx`: 좌우 2분할, 썸네일 전체 높이, 할인뱃지 오버레이
- `src/components/Pagination.tsx`: 슬라이딩 윈도우 5페이지
- `src/components/SearchBar.tsx`: 포커스 시 teal 테두리
- `src/components/Header.tsx`: sticky, desktop에서 DiscountToggle 인라인
- `src/pages/Home.tsx`: 1/2/3열 반응형 그리드, mobile 필터 바 분리
- `src/pages/SearchPage.tsx`: URL q 파라미터 기반 검색
- `src/pages/Detail.tsx`: 포스터 + 상세정보 + 예매 링크
- 주 색상: teal-500 (#14b8a6), 반응형: 375px~1200px+

### Phase 1 — 프로젝트 생성 및 초기 설정

- `package.json`: React 19, React Router v7, Zustand v5, TailwindCSS v4, vite-plugin-pwa 의존성 정의
- `vite.config.ts`: Vite + @tailwindcss/vite + VitePWA 플러그인 설정, API 캐시 런타임 캐싱 포함
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`: strict 모드 TypeScript 설정
- `eslint.config.js`: TypeScript + React Hooks + React Refresh 린트 규칙
- `index.html`: lang="ko", theme-color, PWA meta 태그 포함
- `src/index.css`: TailwindCSS v4 (`@import "tailwindcss"`)
- `src/vite-env.d.ts`: Vite 클라이언트 타입 선언
- `src/main.tsx`: StrictMode + RouterProvider 진입점
- `src/router.tsx`: createBrowserRouter — `/`, `/detail/:id`, `/search` 라우트
- `src/pages/Home.tsx` / `Detail.tsx` / `SearchPage.tsx`: placeholder 페이지 (Phase 4에서 구현)
- `src/api/`, `components/`, `hooks/`, `store/`, `types/`, `utils/`: 폴더 구조 생성
- `.env.local.example`: API 키 환경변수 템플릿
- `.gitignore`: node_modules, dist, .env.local, Playwright 결과 제외
- `npm install` 완료 (461 packages), `npm run build` 통과, PWA sw.js / workbox 정상 생성
