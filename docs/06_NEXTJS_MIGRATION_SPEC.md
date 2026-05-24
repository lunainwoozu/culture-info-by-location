# 10_NEXTJS_MIGRATION_SPEC.md

Vite → Next.js 16 App Router 마이그레이션 — 2026-05-24

---

## 1. 배경 및 목적

기존 Vite + React Router DOM SPA 구조에서 Next.js 16 App Router로 전환한다.

전환 이유:
- Next.js App Router의 파일 기반 라우팅으로 라우트 설정 코드 제거
- Turbopack 기반 빠른 HMR
- Vercel Serverless Function (`src/app/api/`) 지원 — 이후 문화재 API 프록시 구성에 필요
- Next.js 네이티브 PWA 매니페스트 지원

---

## 2. 라우트 구조 변경

### 변경 전 (React Router DOM)

```
src/router.tsx          createBrowserRouter
src/pages/Home.tsx      /
src/pages/Detail.tsx    /detail/:id
src/pages/SearchPage.tsx  /search
```

### 변경 후 (Next.js App Router)

```
src/app/layout.tsx              루트 레이아웃
src/app/page.tsx                /
src/app/detail/[id]/page.tsx    /detail/:id
src/app/search/page.tsx         /search  (Suspense 경계 서버 컴포넌트)
src/app/search/SearchContent.tsx  useSearchParams 클라이언트 컴포넌트
src/app/manifest.ts             PWA 매니페스트 (Next.js 네이티브)
src/app/globals.css             전역 스타일
```

`useSearchParams`는 클라이언트 컴포넌트에서만 사용 가능하므로 `search/page.tsx`는 Suspense 경계로 감싸고, `SearchContent.tsx`에서 훅을 호출한다.

---

## 3. 주요 변경 사항

### 3-1. 라우팅 API 교체

| 변경 전 | 변경 후 |
|---|---|
| `useNavigate()` | `useRouter()` (next/navigation) |
| `useParams()` | `params` props (page.tsx) |
| `useLocation().state` | 제거 — Detail 페이지는 항상 API 직접 호출 |
| `navigate('/path')` | `router.push('/path')` |

Detail 페이지의 `location.state`로 이벤트를 전달하던 패턴 제거. API 응답 시간이 짧고 Next.js App Router에서 state 전달이 복잡해 단순화.

### 3-2. 환경변수 접두사

| 변경 전 | 변경 후 |
|---|---|
| `VITE_CULTURE_API_KEY` | `NEXT_PUBLIC_CULTURE_API_KEY` |
| `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |

### 3-3. PWA 매니페스트

`vite-plugin-pwa` 제거 후 Next.js 네이티브 방식으로 교체.

```ts
// src/app/manifest.ts
import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest { ... }
```

### 3-4. 루트 레이아웃

```tsx
// src/app/layout.tsx
export const metadata: Metadata = { ... }
export const viewport: Viewport = { themeColor: '...' }
export default function RootLayout({ children }) { ... }
```

`Metadata`와 `Viewport`를 layout.tsx에서 export — Next.js 16 방식.

---

## 4. 삭제된 파일

| 파일 | 이유 |
|---|---|
| `vite.config.ts` | Next.js 전환 |
| `index.html` | Next.js가 HTML 직접 생성 |
| `src/main.tsx` | Next.js layout.tsx가 진입점 역할 |
| `src/router.tsx` | App Router 파일 기반 라우팅으로 대체 |
| `src/vite-env.d.ts` | Vite 타입 선언 불필요 |
| `src/pages/` | `src/app/`으로 이전 |
| `tsconfig.app.json`, `tsconfig.node.json` | `tsconfig.json` 단일 파일로 통합 |

---

## 5. 설정 파일 변경

### tsconfig.json

```json
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### next.config.ts

```ts
const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
}
```

### postcss.config.mjs

```js
export default { plugins: { '@tailwindcss/postcss': {} } }
```

### vercel.json

```json
{}
```

Next.js가 라우팅을 네이티브 처리하므로 SPA 리다이렉트 규칙 불필요.

---

## 6. 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `package.json` | next 추가, vite·vite-plugin-pwa·react-router-dom 제거 |
| `tsconfig.json` | 단일 파일 통합, moduleResolution: bundler |
| `next.config.ts` | 신규 |
| `postcss.config.mjs` | @tailwindcss/postcss 플러그인 |
| `vercel.json` | `{}` (Next.js 네이티브 라우팅) |
| `src/app/layout.tsx` | 루트 레이아웃 |
| `src/app/page.tsx` | 홈 페이지 |
| `src/app/manifest.ts` | PWA 매니페스트 |
| `src/app/detail/[id]/page.tsx` | 상세 페이지 |
| `src/app/search/page.tsx` | 검색 Suspense 경계 |
| `src/app/search/SearchContent.tsx` | useSearchParams 클라이언트 컴포넌트 |
| `src/components/Header.tsx` | useNavigate → useRouter |
| `src/components/EventCard.tsx` | useNavigate → useRouter, state 전달 제거 |
| `src/api/cultureInfo.ts` | import.meta.env → process.env |
| `src/api/cultureTicket.ts` | import.meta.env → process.env |
