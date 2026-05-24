# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code(claude.ai/code)에게 지침을 제공합니다.

---

## CLAUDE.md 계층 구조 원칙

이 파일은 **이 프로젝트에 특화된 내용만** 기술한다.
범용 원칙(워크플로우, 네이밍 컨벤션, 브랜치 전략 등)은 `~/.claude/CLAUDE.md`(전역)에 작성하고
이 파일에는 중복 기술하지 않는다.

```
~/.claude/CLAUDE.md               ← 전역: 워크플로우, 코드 스타일, 브랜치 전략 등 모든 프로젝트 공통
└── culture-info-by-location/CLAUDE.md         ← 프로젝트 특화: 기술 스택, 폴더 구조, 명령어, 개발 범위
```

---

# 오늘 하루 문화 일정 (Culture Day)

위치 기반 공연·전시 큐레이션 PWA

## Project Overview

내 위치 기반으로 가까운 공연·전시를 거리순으로 보여주고 할인 정보를 함께 제공하는 PWA.
지도 표시 없이 Haversine 공식으로 거리 계산 후 리스트로 표시. 상세 내용은 [`docs/PRD.md`](./docs/PRD.md) 참조.

## Out of Scope

→ [`docs/PRD.md` — Section 9. Out of Scope](./docs/PRD.md) 참조.

## Commands

```bash
# 의존성 전체 설치 (클론 후)
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 서버 실행 (빌드 후)
npm start

# 린트
npm run lint
```

## Tech Stack

- **프레임워크**: Next.js 16 (App Router, Turbopack)
- **UI 라이브러리**: React 19
- **언어**: TypeScript (TSX)
- **스타일링**: TailwindCSS v4
- **상태 관리**: Zustand (전역 상태, props drilling 최소화)
- **데이터베이스**: Supabase (PostgreSQL 호스팅 + Auth)
- **폼 검증**: Zod
- **아이콘**: React Icons
- **배포**: Vercel
- **아키텍처**: App Router 기반 — `app/` 라우트 단위 페이지, `components/` 공통 컴포넌트, 비즈니스 로직은 custom hook으로 분리

```
src/
├── api/          # 공공 API 호출 함수 (한눈에보는문화정보, 문화릴레이티켓, 문화재)
├── app/          # Next.js App Router 라우트 (page.tsx, layout.tsx 등)
├── components/   # 재사용 공통 컴포넌트 (EventCard, DiscountBadge 등)
├── hooks/        # custom hook (useGeolocation, useEvents 등)
├── store/        # Zustand 스토어 (filterStore, authStore 등)
├── types/        # 공통 타입 정의 (API 응답 타입 포함)
└── utils/        # 유틸 함수 (distance.ts 등)

docs/
├── PRD.md        # 제품 요구사항 정의서 (개발 현황 포함)
├── WORK.md       # 현재 작업 현황
└── HISTORY.md    # 완료된 작업 기록
```

## Code Style

> 네이밍, 컴포넌트 원칙, 브랜치 전략은 `~/.claude/CLAUDE.md`(전역) 참조.

### 이 프로젝트 특화 규칙

- 컴포넌트: PascalCase, 파일명도 동일 (`.tsx`)
- 함수/변수: camelCase
- 타입/인터페이스: PascalCase, `I` 접두사 붙이지 않음
- API 호출 함수는 `src/api/` 에만 위치, 컴포넌트 내 직접 호출 금지
- 비즈니스 로직은 `src/hooks/` custom hook으로 분리
- Zustand store는 기능 단위로 파일 분리 (`filterStore.ts`, `locationStore.ts`)
- 스타일링: TailwindCSS v4 유틸리티 클래스 사용

### API 연동 규칙

- 브라우저 직접 호출 API 키: `.env.local`에서 `NEXT_PUBLIC_` 접두사로 관리
- 서버 전용 API 키(예: `HERITAGE_API_KEY`): `NEXT_PUBLIC_` 접두사 없이 관리 — 클라이언트에 노출되지 않음
- API 응답 타입은 `src/types/`에 별도 정의
- 에러 처리 필수, 로딩·에러 상태 항상 UI에 반영

### API 연동 상세

| 환경변수                      | API                                         | Base URL                                                        | 역할                               |
| ----------------------------- | ------------------------------------------- | --------------------------------------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_CULTURE_API_KEY` | 한국문화정보원 한눈에보는문화정보조회서비스 | `https://apis.data.go.kr/B553457/cultureinfo`                   | 공연·전시 리스트, 좌표             |
|                               | 한국문화정보원 문화릴레이티켓 할인조회      | `https://apis.data.go.kr/B553457/nopenapi/rest/ticketdiscounts` | 할인 정보 매칭                     |
| `HERITAGE_API_KEY`            | 국가유산청 국가유산검색 목록·상세           | `http://www.khs.go.kr/cha`                                      | 문화재 목록·상세 (서버에서만 사용) |

**CORS**

- 문화정보·할인티켓 API: `Access-Control-Allow-Origin: *` → 브라우저 직접 호출 가능, 프록시 불필요
- 국가유산청 API: CORS 차단 + 클라이언트 직접 호출 불가 → **Vercel Serverless Function 프록시 경유 필수**
  - 환경변수 `HERITAGE_API_KEY`는 서버 전용 (`NEXT_PUBLIC_` 접두사 없이 관리, 클라이언트에 노출되지 않음)
  - 프론트에서는 `/api/heritage?...` 형태로 호출

#### 문화정보 API — `/area2` (지역별 목록)

- 요청 파라미터: `serviceKey`, `numOfRows`, `pageNo`, `gpsxfrom`/`gpsxto`(경도 범위), `gpsyfrom`/`gpsyto`(위도 범위), `keyword`, `from`/`to`(기간), `sido`, `sigungu`, `sortStdr`(1:등록일·2:공연명·3:지역), `serviceTp`(A:공연전시·B:행사축제·C:교육체험)
- 응답 형식: XML
- 응답 필드: `seq`, `serviceName`, `title`, `place`, `startDate`(YYYYMMDD), `endDate`(YYYYMMDD), `realmName`, `area`, `sigungu`, `thumbnail`, `gpsX`(경도), `gpsY`(위도)
- `url`·`price`는 이 엔드포인트에서 반환되지 않음 → `/detail2`에서 획득

#### 문화정보 API — `/detail2` (상세 조회)

- 요청 파라미터: `serviceKey`, `seq`
- 응답 형식: XML
- 응답 필드: `seq`, `title`, `place`, `startDate`, `endDate`, `realmName`, `area`, `sigungu`, `price`(티켓요금), `contents1`(상세내용), `url`(관람URL), `phone`(문의처), `gpsX`, `gpsY`, `imgUrl`, `placeUrl`, `placeAddr`(공연장주소), `placeSeq`

#### 할인티켓 API — `/list`

- 역할: cultureInfo로 구성된 이벤트에 할인 여부를 매칭하기 위한 목록 조회. 이벤트 생성에는 사용하지 않음
- 요청 파라미터: `serviceKey`, `numOfRows`, `pageNo`, `keyword`
- 응답 형식: XML
- 응답 필드: `seq`, `title`, `img`, `imgDesc`, `price`, `startDate`(YYYY-MM-DD), `endDate`(YYYY-MM-DD), `place`, `area`, `discountRate`
- 코드에서 사용하는 필드: `title`·`place`(매칭), `img`·`price`·`discountRate`(뱃지 표시)
- 참고: `/detail?seq=` 엔드포인트도 존재하나 `/list` 필드로 충분해 미구현

- 두 API 데이터는 **공연명(`title`) 또는 공연장명(`place`) 기준**으로 매칭하여 할인 뱃지 표시

#### 국가유산청 API — 목록 (`/cha/SearchKindOpenapiList.do`)

- 호출 방식: Vercel Serverless Function `/api/heritage` 경유
- 요청 파라미터: `ccbaCtcd`(시도코드, 서울=11), `pageUnit`, `pageIndex`
- 응답 형식: XML → 프록시에서 JSON으로 변환 후 반환
- 응답 필드: `ccbaMnm1`(문화재명), `ccbaKdcd`(종목코드), `ccbaAsno`(관리번호), `ccbaCtcd`(시도코드), `longitude`(경도), `latitude`(위도)

#### 국가유산청 API — 상세 (`/cha/SearchKindOpenapiDt.do`)

- 호출 방식: Vercel Serverless Function `/api/heritage` 경유
- 필수 파라미터: `ccbaKdcd`, `ccbaAsno`, `ccbaCtcd`
- 응답 필드: `ccbaMnm1`(문화재명), `ccbaKdcd`, `ccbaCtcd`, `longitude`, `latitude`, `content`(설명), `imageUrl`

### 거리 계산

- `src/utils/distance.ts` — Haversine 공식 사용
- 위치 수집: `navigator.geolocation.getCurrentPosition`
- 위치 기반 바운딩 박스 계산 후 `gpsxfrom`/`gpsxto`/`gpsyfrom`/`gpsyto` 파라미터로 API 호출
- 권한 거부 또는 수집 실패 시 에러 상태 처리 필수

## 기술적 결정 이력

### 문화재 연동 — 초기 제외 후 재도입

**초기 제외 이유**

- 국가유산청 API가 "클라이언트 직접 호출 불가"로 CORS 차단
- 응답이 XML 전용이며, 위치정보 API는 GIS 전용(WMS/WFS) 방식으로 일반 REST와 다름
- 초기 MVP 일정상 백엔드 구축 공수가 부담스러워 제외

**지오코딩은 제외 이유가 아님**

- `DOMParser`로 XML 파싱은 30분 이내
- 지오코딩(주소→좌표 변환)은 공연 API 좌표 필드 유무 확인 과정에서 언급됐으나, 공연 API에 좌표(`gpsxfrom`/`gpsyfrom`)가 있음이 확인되어 불필요해짐
- 문화재 API는 `longitude`/`latitude` 필드를 직접 제공하므로 지오코딩 자체가 필요 없음

**재도입 결정**

- 프로젝트 일정에 여유가 생김
- "오늘 하루 문화 일정" 콘셉트에 문화재가 포함되는 게 기획 의도에 맞음
- Vercel Serverless Function으로 프록시 구성 시 CORS 문제 해결 가능, 별도 서버 불필요

## 개발 순서 (기능 단위)

전역 CLAUDE.md의 기획 → 승인 → 구현 흐름에 아래 테스트 단계를 추가한다.

1. 작업 범위와 구현 방법을 계획으로 정리한다.
2. 사용자 승인 후 기획 문서(PRD 등)를 작성한다.
3. 구현을 시작한다.
4. **기능 구현 시 Playwright(이외 더 효율성 있는 검사 도구가 있으면 그것으로 진행)로 동작을 검증한다.**
5. 테스트 통과 확인 후 개발 현황 테이블을 ✅로 업데이트한다.

### Playwright 테스트 규칙

- 테스트 파일 위치: `tests/` 디렉터리
- 실행 명령: `npx playwright test --reporter=line`
- 기능별로 spec 파일 분리 (`home.spec.ts`, `detail.spec.ts` 등)
- 검증 범위: 위치 권한 처리, 카드 렌더링, 필터 동작, 상세 페이지 이동
- 실제 API 호출은 테스트에서 mock 처리

### 시간 초과 규칙

- 단일 작업(명령 실행, 빌드, 테스트 등)이 **5분 이상** 소요될 것으로 예상되면 즉시 멈추고 사용자에게 어느 단계인지 보고한다.
- 진행 중인 명령이 5분을 초과하면 중단하고 상황을 설명한 뒤 사용자 지시를 기다린다.

### 버그 처리 규칙

- 작업 중 버그를 발견하면 **즉시 수정하지 않는다.**
- 발견 즉시 `docs/WORK.md`의 `## 버그` 섹션에 기록한다.
- 현재 작업을 완료한 뒤, 별도 작업 항목으로 분리해서 처리한다.
- **예외**: 현재 작업의 테스트가 버그로 인해 통과 불가능한 경우에만 즉시 수정한다.

## WORK.md 관리 규칙

`docs/WORK.md`는 **현재 진행 중이거나 앞으로 할 작업만** 관리한다.

### Claude가 반드시 해야 하는 행동

1. **작업 시작 전**: `docs/WORK.md`의 `## 진행 예정`에 작업 항목을 추가한다.
2. **작업 완료 후**:
   - 완료 항목을 `docs/WORK.md`에서 **제거**한다.
   - 해당 항목을 `docs/HISTORY.md`로 **이동**한다 (날짜 포함).
3. **기술적 결정이 생겼을 때**: `docs/WORK.md`의 `## 결정 사항`에 항목과 이유를 기록한다.

### WORK.md에 두지 않는 것

- 완료된 작업 내역 → `docs/HISTORY.md`로 이동
- 기능 요구사항 → `docs/PRD.md` 참조

## HISTORY.md 관리 규칙

`docs/HISTORY.md`는 **완료된 작업의 전체 이력**을 담는다.

### Claude가 반드시 해야 하는 행동

- 작업 완료 시 즉시 `docs/HISTORY.md`에 기록한다.
- 기록 형식: **날짜 / 작업 제목 / 주요 변경 파일 및 내용**
- `docs/WORK.md`에서 제거한 완료 항목을 그대로 옮기되, 날짜를 반드시 포함한다.

## 작업 조회 규칙

- **"다음 작업은?"** 또는 **"앞으로 할 작업은?"** 이라고 물으면
  → `docs/WORK.md`를 먼저 읽고 답한다.
- **"이전에 한 작업은?"** 또는 **"완료한 작업은?"** 이라고 물으면
  → `docs/HISTORY.md`를 참고하라고 안내한다.

## 문서 파일 역할

| 파일              | 역할                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| `docs/PRD.md`     | 제품 요구사항 정의서 — 목표, 유저 스토리, 기능 명세, 개발 현황, Out of Scope |
| `docs/WORK.md`    | 현재 작업 현황 및 앞으로 할 일                                               |
| `docs/HISTORY.md` | 완료된 작업 기록                                                             |
