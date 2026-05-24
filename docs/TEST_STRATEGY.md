# TEST_STRATEGY.md

테스트 전략 및 설정. 개별 테스트 케이스는 각 기능 스펙 파일의 "테스트 커버리지" 섹션에 기록한다.

---

## 테스트 레이어

| 레이어 | 도구 | 대상 |
|---|---|---|
| E2E | Playwright | 주요 사용자 플로우 — API·GPS mock 후 실제 브라우저 렌더링 검증 |

> Vitest 단위 테스트는 스펙 문서에는 있으나 현재 미구현. 필요 시 추가.

---

## 설정

### playwright.config.ts 핵심 설정

```ts
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://localhost:3000' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 실행 명령

```bash
npx playwright test --reporter=line

# 특정 파일만
npx playwright test tests/home.spec.ts --reporter=line
```

---

## Mock 패턴

### GPS

```ts
await context.grantPermissions(['geolocation'])
await page.setGeolocation({ latitude: 37.5665, longitude: 126.9780 })
```

### API (네트워크 인터셉트)

```ts
await page.route('**/cultureinfo/**', (route) =>
  route.fulfill({ body: AREA2_XML, contentType: 'application/xml' })
)
```

### Fixture 구조

```
tests/
├── fixtures.ts      # XML mock 상수 (AREA2_XML, DETAIL_XML, DISCOUNT_XML 등)
├── home.spec.ts
├── detail.spec.ts
└── search.spec.ts
```

fixture는 최소한의 유효한 XML만 포함한다. 실제 API 응답을 그대로 복사하지 않는다.

---

## 파일별 커버리지 위치

| 기능 | 테스트 케이스 위치 |
|---|---|
| 홈 화면, 할인 필터 | `docs/02_UI_SPEC.md` |
| 키워드 검색 | `docs/03_KEYWORD_SEARCH_SPEC.md` |
| 상세 페이지 | `docs/05_DETAIL_REDESIGN_SPEC.md` |
| 무료 배지 · 거리 표시 | `docs/BUGFIX.md` |
| 로그인 · 회원가입 | `docs/11_AUTH_SPEC.md` |
