# 06_TEST_SPEC.md

테스트 전략 및 명세 — 2026-05-18

---

## 테스트 레이어 구성

| 레이어 | 도구 | 대상 | 이유 |
|---|---|---|---|
| 단위 테스트 | Vitest | 유틸 함수, API 파싱 로직 | 외부 의존 없는 순수 함수 빠르게 검증 |
| E2E 테스트 | Playwright | 주요 사용자 플로우 | API·GPS mock 후 실제 브라우저 렌더링 검증 |

---

## 설치 패키지

```bash
# Vitest + 관련 도구
npm install -D vitest @vitest/coverage-v8

# Playwright
npm install -D @playwright/test
npx playwright install chromium
```

---

## Vitest 단위 테스트

### 파일 위치

```
tests/unit/
├── distance.test.ts
└── cultureInfo.test.ts
```

### `distance.test.ts`

| 테스트 케이스 | 검증 내용 |
|---|---|
| haversineDistance — 동일 좌표 | 0km 반환 |
| haversineDistance — 서울↔부산 | 약 325km ± 5km 범위 내 |
| haversineDistance — 10km 이내 판별 | 결과값 <= 10 확인 |
| getBoundingBox — 반경 10km | latMin < lat < latMax, lngMin < lng < lngMax |
| formatDistance — 1km 미만 | "800m" 형식 |
| formatDistance — 1km 이상 | "1.2km" 형식 |

### `cultureInfo.test.ts`

| 테스트 케이스 | 검증 내용 |
|---|---|
| toApiDate — Date 객체 → YYYYMMDD | 포맷 정확성 |
| parseItems — 정상 XML | 모든 필드 파싱 (url, price 포함) |
| parseItems — 빈 items | 빈 배열 반환 |
| parseItems — 필드 누락 XML | 누락 필드 빈 문자열 처리 |

---

## Playwright E2E 테스트

### 파일 위치

```
tests/e2e/
├── home.spec.ts
├── search.spec.ts
└── detail.spec.ts
```

### Mock 전략

- **GPS**: `page.context().grantPermissions` + `page.setGeolocation`으로 위도·경도 주입
- **API**: `page.route('**/cultureinfo/**', ...)` 로 실제 호출 차단, 고정 fixture XML 반환
- **Fixture**: `tests/fixtures/` 에 최소 XML 샘플 파일 보관

### `home.spec.ts`

| 시나리오 | 검증 내용 |
|---|---|
| GPS 허용 + 데이터 있음 | EventCard 렌더링, 거리 표시, 건수 텍스트 |
| GPS 허용 + 할인 필터 ON | 할인 없는 카드 숨김 |
| GPS 거부 | LocationErrorPrompt 표시, 카드 미표시 |
| 페이지네이션 | 21건 이상 시 페이지 버튼 표시, 페이지 이동 |

### `search.spec.ts`

| 시나리오 | 검증 내용 |
|---|---|
| 키워드 검색 | Header SearchBar 입력 → `/search?q=키워드` 이동, 결과 렌더링 |
| 검색 결과 없음 | "검색 결과가 없습니다" 메시지 표시 |
| 할인 필터 토글 | 할인 없는 카드 숨김, 건수 변경 |

### `detail.spec.ts`

| 시나리오 | 검증 내용 |
|---|---|
| 카드 클릭 → 상세 진입 | 제목, 장소, 날짜 표시 |
| 상세 정보 이동 버튼 | detail2 로드 후 활성화, href 정상 |
| 뒤로가기 버튼 | 이전 페이지로 이동 |
| URL 직접 접근 | skeleton → 정상 렌더링 |

---

## 실행 명령

```bash
# 단위 테스트
npx vitest run

# 단위 테스트 (watch)
npx vitest

# E2E 테스트
npx playwright test --reporter=line

# E2E 특정 파일만
npx playwright test tests/e2e/home.spec.ts --reporter=line
```

---

## package.json scripts 추가

```json
"test:unit": "vitest run",
"test:e2e": "playwright test --reporter=line",
"test": "vitest run && playwright test --reporter=line"
```

---

## 영향 범위

| 파일/폴더 | 변경 유형 |
|---|---|
| `package.json` | devDependencies 추가, scripts 추가 |
| `vite.config.ts` | Vitest 설정 추가 (`test` 블록) |
| `playwright.config.ts` | 신규 생성 |
| `tests/unit/*.test.ts` | 신규 생성 |
| `tests/e2e/*.spec.ts` | 신규 생성 |
| `tests/fixtures/` | API mock XML 샘플 신규 생성 |
