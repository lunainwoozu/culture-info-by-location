# 11_AUTH_SPEC.md

로그인 · 회원가입 (localStorage 기반) — 2026-05-24

---

## 1. 배경 및 목적

백엔드 없이 MVP 단계에서 로그인 기능을 제공한다. 이후 Supabase Auth로 마이그레이션할 예정이므로 인터페이스를 단순하게 유지한다.

- 회원 정보: `localStorage` 저장 (브라우저 영속)
- 로그인 세션: `sessionStorage` 저장 (탭 닫으면 만료)
- 폼 검증: Zod

---

## 2. 데이터 구조

### 회원 저장 (localStorage)

```ts
// key: 'registered_users'
interface StoredUser {
  email: string
  password: string   // 평문 저장 — MVP 한정, 추후 Supabase Auth로 교체 예정
}
```

### 세션 저장 (sessionStorage)

```ts
// key: 'auth_user'
interface User {
  email: string
}
```

---

## 3. Zustand 스토어 (`src/store/authStore.ts`)

```ts
interface AuthState {
  user: User | null
  login: (email: string) => void
  logout: () => void
}
```

- 초기화 시 `sessionStorage`에서 세션을 불러와 `user` 설정
- `login`: sessionStorage에 저장 후 `user` 업데이트
- `logout`: sessionStorage 삭제 후 `user: null`

SSR 환경(`typeof window === 'undefined'`)에서는 `null` 반환 처리.

---

## 4. 로그인 페이지 (`src/app/login/page.tsx`)

### 폼 스키마

```ts
const loginSchema = z.object({
  email: z.email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력해 주세요'),
})
```

### 로그인 흐름

1. Zod 검증 실패 → 필드별 에러 메시지 표시
2. localStorage에서 사용자 조회
3. 이메일·비밀번호 불일치 → `root` 에러 ("이메일 또는 비밀번호가 올바르지 않습니다")
4. 성공 → `authStore.login(email)` → `/` 이동

---

## 5. 회원가입 페이지 (`src/app/signup/page.tsx`)

### 폼 스키마

```ts
const signupSchema = z.object({
  email: z.email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  confirm: z.string(),
}).refine((data) => data.password === data.confirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirm'],
})
```

### 회원가입 흐름

1. Zod 검증 실패 → 필드별 에러 메시지 표시
2. 이미 등록된 이메일 → `root` 에러 ("이미 사용 중인 이메일입니다")
3. 성공 → localStorage에 저장 → `authStore.login(email)` → `/` 이동

---

## 6. Header 연동 (`src/components/Header.tsx`)

```tsx
const { user, logout } = useAuthStore()

// 비로그인: 로그인 버튼 → /login 이동
// 로그인: 로그아웃 버튼 → logout() 호출
```

---

## 7. 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/store/authStore.ts` | 신규 — Zustand 세션 상태 |
| `src/app/login/page.tsx` | 신규 — 로그인 폼 |
| `src/app/signup/page.tsx` | 신규 — 회원가입 폼 |
| `src/components/Header.tsx` | 로그인/로그아웃 버튼 추가 |
| `package.json` | zod 의존성 추가 |

---

## 8. 마이그레이션 계획 (Supabase Auth)

현재 구현은 MVP 전용. Supabase Auth 도입 시 교체 범위:

| 현재 | Supabase 이후 |
|---|---|
| localStorage 회원 저장 | Supabase Auth 사용자 테이블 |
| sessionStorage 세션 | Supabase 세션 토큰 |
| 평문 비밀번호 | Supabase 자동 해싱 |
| `authStore.login/logout` | Supabase signIn/signOut으로 교체 |
