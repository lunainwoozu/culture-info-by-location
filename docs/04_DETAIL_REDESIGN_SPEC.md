# 05_DETAIL_REDESIGN_SPEC.md

상세 페이지 재설계 + API 확장 — 2026-05-18

---

## 변경 개요 및 결정 이유

### API 구조 결정: 문화정보 API 유지, 할인티켓 API 보조 역할로 축소

- 검토 배경: 예매 링크 오류를 수정하면서 culture.go.kr 상세 페이지 URL 구조(`pblprfrSn` 파라미터)를 확인함. 이를 연결하려면 할인티켓 API의 `seq`와 `pblprfrSn`이 동일해야 하나, 두 API가 서로 다른 공연 데이터를 갖고 있어 매칭이 불안정함.
- 할인티켓 API 단독 사용 방향도 검토했으나, 해당 API는 GPS 좌표(`gpsX`/`gpsY`), `realmName`(분야), `sigungu`(구군) 필드가 없어 위치 기반 거리 계산과 분야 표시가 불가능해짐.
- 문화정보 API는 `url`·`price` 필드를 자체 보유하고 있어, 할인티켓 API에 의존하지 않고도 링크와 가격 표시가 가능함을 확인.
- **결론:** 문화정보 API를 1차 데이터 소스로 유지. 할인티켓 API는 할인율·할인 뱃지 매칭 전용으로만 사용.

---

### 예매 버튼 URL 및 텍스트 변경

- 현재: `culture.go.kr/search/searchList.do?keyword=제목` → 전부 오류 페이지 이동
- 변경: 문화정보 API 응답 내 `url` 필드 사용, 버튼명 "상세 정보 이동"으로 수정
- **Why:** culture.go.kr의 검색 URL 구조가 변경되어 모든 예매 링크가 깨진 상태였음. API 응답에 직접 URL 필드가 있으므로 하드코딩 URL 대신 API 데이터를 신뢰하는 방향으로 전환. "예매하기"라는 문구는 실제로 예매 페이지가 아닌 공연 상세 페이지로 이동하므로 버튼명도 실제 동작에 맞게 수정.

### 가격 표시 변경

- 현재: 할인티켓 API와 매칭된 경우에만 가격 표시 → 대부분 공연에서 가격 미표시
- 변경: 문화정보 상세 API(`/detail2`)의 `price` 필드 사용 → 모든 공연에서 가격 표시 가능
- **Why:** 사용자가 상세 페이지에서 가격 확인을 원하나, 할인티켓 API 매칭률이 낮아 대부분의 공연에 가격이 표시되지 않았음. 문화정보 API 명세 상 `/detail2` 엔드포인트의 `item` 내에 `url`, `price` 필드가 존재함을 확인. 단, 목록 API(`/area2`)에는 해당 필드가 없으므로 상세 페이지 진입 시 `/detail2` 별도 호출로 획득.

### 날짜 범위 확장

- 현재: API 기본값 → 현재 진행 중인 공연만 반환 (시작 예정 공연 미표시)
- 변경: `from=오늘`, `to=오늘+3개월` 파라미터 추가
- **Why:** 사용자가 오늘 이후 예정된 공연도 탐색할 수 있어야 한다고 요청. 무제한 확장 시 불필요한 결과 증가 우려로 3개월로 제한.

### 상세 페이지 레이아웃 재설계

- 현재: 모바일 기준 단일 컬럼 고정 (`max-w-screen-sm`)
- 변경: 모바일 단일 컬럼 + 데스크탑(lg+) 2컬럼
- **Why:** 프로젝트가 375px~1200px+ 반응형을 목표로 하나, 상세 페이지만 모바일 레이아웃이 고정되어 있어 데스크탑에서 콘텐츠가 지나치게 좁게 표시됨. 홈·검색 페이지와 일관성 있는 반응형 구조로 통일.

---

| 항목 | 현재 | 변경 후 |
|---|---|---|
| 예매 버튼 URL | 하드코딩된 culture.go.kr 검색 URL | 문화정보 API `url` 필드 |
| 예매 버튼 텍스트 | "문화포털에서 예매하기" | "상세 정보 이동" |
| 가격 표시 | 할인티켓 API 매칭 시에만 | 문화정보 API `price` 필드 (항상) |
| 날짜 범위 | API 기본값 (현재 진행 중만) | from=오늘, to=오늘+3개월 |
| 상세 페이지 레이아웃 | 모바일 단일 컬럼 고정 | 모바일 단일 컬럼 + 데스크탑 2컬럼 |

---

## API 변경

### 엔드포인트별 제공 필드 (실제 확인 결과)

| 엔드포인트 | url | price | 비고 |
|---|---|---|---|
| `/area2` (목록) | ❌ 없음 | ❌ 없음 | 실제 API 응답 확인 |
| `/detail2` (상세) | ✅ 있음 | ✅ 있음 | 명세서 확인 |

### `src/types/api.ts`

`CultureInfoItem`에 필드 추가 (parseItems가 두 엔드포인트에 공용으로 사용되므로):
- `url: string` — `/area2` 호출 시 빈 문자열, `/detail2` 호출 시 실제 URL
- `price: string` — `/area2` 호출 시 빈 문자열, `/detail2` 호출 시 실제 가격

`Event`에 필드 추가:
- `url: string`
- `price: string`

### `src/api/cultureInfo.ts`

- `parseItems`: `url`, `price` 태그 파싱 추가 (두 엔드포인트 공용)
- `fetchPage`(`/area2`): `from`(오늘 YYYYMMDD), `to`(오늘+3개월 YYYYMMDD) 파라미터 추가
- `fetchCultureInfoDetail(seq)` 신규 추가: `/detail2?seq={seq}` 호출, `CultureInfoItem` 반환

### `src/hooks/useEvents.ts`

- `url`, `price`는 `/area2`에서 제공되지 않으므로 빈 문자열로 매핑 (`url: ''`, `price: ''`)
- 실제 값은 Detail 페이지에서 `/detail2` 호출로 획득

### `src/pages/Detail.tsx`

**렌더링 흐름:**
1. stateEvent 있음 → 즉시 렌더링(제목·날짜·장소 등), `detailLoading=true` 상태로 버튼 비활성
2. stateEvent 없음 → 스켈레톤 표시
3. 항상 `fetchCultureInfoDetail(id)` + `fetchTicketDiscounts()` 병렬 호출
4. 완료 후 `event` 갱신 (url, price 포함), 버튼 활성화
5. stateEvent 없고 detail 실패 → notFound 처리

---

## 상세 페이지 레이아웃 재설계

### 공통

- 컨테이너: `max-w-screen-lg` 중앙 정렬
- 스티키 헤더: 뒤로가기 버튼

### 모바일 (< lg)

```
┌─────────────────────────┐
│ sticky: ← 뒤로가기       │
├─────────────────────────┤
│  포스터 (h-64~80)        │  object-cover, bg-gray-100 fallback
├─────────────────────────┤
│ [할인 뱃지]  (있으면)    │
│ 공연 제목 text-xl        │  bg-white, p-4~6
│                         │
│ 📍 장소 · 구군           │
│ 📅 날짜 범위             │
│ 🎭 분야                 │
│ 🎟 가격 (할인율 병기)    │
│                         │
│ [상세 정보 이동 ↗]       │
└─────────────────────────┘
```

### 데스크탑 (>= lg)

```
┌────────────────────────────────────────────────┐
│ sticky: max-w-screen-lg container → ← 뒤로가기 │
├────────────────────────────────────────────────┤
│ ┌─────────────────┬──────────────────────────┐ │
│ │                 │ [할인 뱃지]               │ │
│ │  포스터          │ 공연 제목 text-2xl        │ │
│ │  (w-2/5,        │                          │ │
│ │  h=오른쪽 높이) │ 📍 장소 · 구군            │ │
│ │  object-cover   │ 📅 날짜 범위              │ │
│ │                 │ 🎭 분야                  │ │
│ │                 │ 🎟 가격 (할인율 병기)     │ │
│ │                 │                          │ │
│ │                 │ [상세 정보 이동 ↗]        │ │
│ └─────────────────┴──────────────────────────┘ │
│   rounded-2xl, shadow-sm, bg-white card         │
└────────────────────────────────────────────────┘
```

### 가격 표시 로직

- `event.price` 있음 + `event.discount` 있음: `price문자열 (N% 할인)`
- `event.price` 있음 + 할인 없음: `price문자열`
- `event.price` 없음 + `event.discount` 있음: `discount.price (N% 할인)`
- 둘 다 없음: 가격 행 숨김

### 상세 정보 이동 버튼

- `event.url` 있음: 정상 링크 (target="_blank")
- `event.url` 없음: 버튼 비활성화 (opacity-50, pointer-events-none)

---

## 영향 범위

| 파일 | 변경 유형 |
|---|---|
| `src/types/api.ts` | `CultureInfoItem`·`Event`에 `url`, `price` 필드 추가 |
| `src/api/cultureInfo.ts` | `parseItems`에 url/price 파싱 추가, `/area2`에 날짜 파라미터 추가, `fetchCultureInfoDetail` 신규 추가 |
| `src/hooks/useEvents.ts` | url/price 빈 문자열로 매핑 |
| `src/pages/Detail.tsx` | 항상 `/detail2` 호출, stateEvent 즉시 렌더 + detail 로드 후 버튼 활성화 |
