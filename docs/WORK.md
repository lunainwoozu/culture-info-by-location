# WORK.md

현재 진행 중이거나 앞으로 할 작업만 관리한다.
완료된 항목은 즉시 `HISTORY.md`로 이동한다.

---

## 진행 중

### 문화재 연동 (`feature/heritage-integration`)

**완료**
- `src/types/heritage.ts` — HeritageItem, HeritageDetail 타입
- `src/app/api/heritage/route.ts` — Vercel Serverless Function 프록시 (list/detail/image, lat·lng 서버 필터링, 1시간 캐시)

**미완료**
- `src/api/heritage.ts` — 목록·상세·이미지 API 함수
- `src/hooks/useHeritage.ts` — 문화재 데이터 훅 (위치 있으면 필터, 없으면 전체에서 5개)
- `src/hooks/useEvents.ts` — 위치 없을 때 최신 5개 API 호출로 변경
- `src/api/cultureInfo.ts` — fetchCultureInfoLatest 추가
- `src/components/CultureCard.tsx` — 공용 카드 컴포넌트 (Heritage·Event 공유)
- `src/app/heritage/page.tsx` — 문화재 목록 (무한 스크롤)
- `src/app/heritage/[id]/page.tsx` — 문화재 상세
- `src/app/events/page.tsx` — 공연·전시 목록 (무한 스크롤)
- `src/store/locationStore.ts` — requestLocation 액션 추가
- `src/components/Header.tsx` — 위치 재요청 버튼
- `src/app/page.tsx` — 섹션 구조 개편 (Heritage 5개 + Events 5개 + 더 보기)
- `src/components/EventCard.tsx` — CultureCard 기반으로 교체, 가격 lazy load (IntersectionObserver)

---

## 진행 예정

없음

---

## 버그

없음

---

## 결정 사항

| 날짜       | 결정                                   | 이유                                                                       |
| ---------- | -------------------------------------- | -------------------------------------------------------------------------- |
| 2026-05-18 | CORS 프록시 제거                       | 두 API 모두 `Access-Control-Allow-Origin: *` 확인, 브라우저 직접 호출 가능 |
| 2026-05-18 | 환경변수 단일화 `VITE_CULTURE_API_KEY` | 두 API가 동일 서비스 키 사용                                               |
| 2026-05-18 | 페이지네이션 방식 채택                 | 무한 스크롤 대비 구현 속도 빠름                                            |
| 2026-05-18 | 날짜 범위: 현재 진행 중인 전체         | endDate ≥ 오늘 기준으로 필터링                                             |
| 2026-05-18 | 거리 반경: 10km                        | 대중교통 기준 한 지하철 권역 이동 범위                                     |
| 2026-05-18 | Detail 단일 로딩 상태 채택             | 전체 카드 내용을 한 번에 불러와 UX를 상향시키기 위함                       |
| 2026-05-18 | DetailSkeleton 독립 컴포넌트로 분리    | Detail 페이지 레이아웃과 동일한 구조의 스켈레톤 필요, 재사용 고려해 `src/components/`에 위치 |
| 2026-05-24 | 즐겨찾기·로그인 localStorage 우선 구현 | 백엔드 없이 MVP 단계에서 즐겨찾기 제공, 추후 서버 마이그레이션 예정        |
| 2026-05-24 | 국가유산청 API 키 불필요 확인          | 실제 호출 테스트 결과 API 키 없이 정상 응답, HERITAGE_API_KEY 환경변수 불필요 |
| 2026-05-24 | 문화재 목록 이미지: 이미지 API 사용    | 목록 API에 이미지 없음 → SearchImageOpenapi.do 별도 호출, pageUnit=1로 1장만 요청 |
| 2026-05-24 | 문화재 상세 이미지: 상세 API imageUrl 사용 | 상세 API를 이미 호출하므로 이미지 API 중복 호출 불필요                   |
| 2026-05-24 | 카드 이미지 lazy load: IntersectionObserver | 목록 아이템 수 가변적, 뷰포트 진입 시점에만 이미지 API 호출              |
| 2026-05-24 | 공용 카드 컴포넌트: CultureCard        | Heritage·Event 카드 레이아웃 동일, 별도 HeritageCard 미생성               |
| 2026-05-24 | 훅 분리 유지: useHeritage·useEvents    | 데이터 소스·파라미터·필터 로직이 달라 useCulture 통합 불가                |
| 2026-05-24 | 메인 5개 + 목록 페이지 패턴 적용      | Heritage·Event 모두 메인에서 5개, 더 보기 → 무한 스크롤 목록 페이지      |
| 2026-05-24 | sampleData.ts 제거                     | 위치 없어도 API 호출 가능, 실제 데이터 slice로 대체                       |
| 2026-05-24 | 프록시에서 lat·lng 받아 10km 필터·거리 정렬 | 클라이언트로 2317개 전체 내려보내지 않고 서버에서 필터 후 반환          |
