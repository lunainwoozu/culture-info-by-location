# TECH_SPEC.md — 기술 구현 명세

**작성일**: 2026-05-18  
PRD의 기능 요구사항을 어떻게 구현할지 기술한 문서. 코드 작성 전 기준 문서로 사용한다.

---

## 1. 전체 데이터 흐름

```
사용자 접속
  └─► useGeolocation → locationStore (lat, lng)
        └─► useEvents
              ├─► fetchCultureInfoArea (문화정보 API /area2)
              │     → 10km 바운딩 박스 파라미터로 호출
              │     → XML 파싱 → CultureInfoItem[]
              ├─► fetchTicketDiscounts (할인티켓 API /list)
              │     → XML 파싱 → TicketDiscountItem[]
              └─► 매칭 + 거리 계산 + 정렬
                    → Event[] (거리순, 10km 이내)
                          └─► filterStore (할인 필터 토글)
                                └─► Home / SearchPage 렌더링
```

---

## 2. 상태 관리 (Zustand)

### `src/store/locationStore.ts`

| 상태 | 타입 | 설명 |
|---|---|---|
| `lat` | `number \| null` | 위도 |
| `lng` | `number \| null` | 경도 |
| `loading` | `boolean` | 위치 수집 중 |
| `error` | `string \| null` | 에러 메시지 |

액션: `setLocation(lat, lng)`, `setError(msg)`, `setLoading(bool)`

### `src/store/filterStore.ts`

| 상태 | 타입 | 설명 |
|---|---|---|
| `discountOnly` | `boolean` | 할인 공연만 보기 토글 |
| `keyword` | `string` | 검색어 |

액션: `toggleDiscountOnly()`, `setKeyword(keyword)`

---

## 3. API 연동

### 3-1. 문화정보 API (`src/api/cultureInfo.ts`)

- **엔드포인트**: `GET https://apis.data.go.kr/B553457/cultureinfo/area2`
- **인증**: `serviceKey=VITE_CULTURE_API_KEY` (쿼리 파라미터)
- **CORS**: `Access-Control-Allow-Origin: *` → 브라우저 직접 호출

**요청 파라미터**

| 파라미터 | 값 | 설명 |
|---|---|---|
| `serviceKey` | env | API 인증키 |
| `numOfRows` | 100 | 한 번에 최대 100건 |
| `pageNo` | 1~ | 페이지 번호 |
| `gpsxfrom` | lng - δ | 경도 하한 |
| `gpsxto` | lng + δ | 경도 상한 |
| `gpsyfrom` | lat - δ | 위도 하한 |
| `gpsyto` | lat + δ | 위도 상한 |
| `keyword` | 선택 | 검색어 |

δ는 Haversine 기반으로 10km에 해당하는 위경도 차이를 계산.

**응답 XML → 파싱 필드**

```
seq, serviceName, title, place, startDate(YYYYMMDD),
endDate(YYYYMMDD), realmName, area, sigungu,
thumbnail, gpsX(경도), gpsY(위도)
```

**totalCount 처리**: 100건 초과 시 `Math.ceil(totalCount / 100)` 페이지만큼 병렬 호출.

### 3-2. 할인티켓 API (`src/api/cultureTicket.ts`)

- **엔드포인트**: `GET https://apis.data.go.kr/B553457/nopenapi/rest/ticketdiscounts/list`
- **인증**: 동일 API 키
- **CORS**: `Access-Control-Allow-Origin: *`

**요청 파라미터**

| 파라미터 | 값 | 설명 |
|---|---|---|
| `serviceKey` | env | API 인증키 |
| `numOfRows` | 500 | 전체 할인 목록 한 번에 수집 |
| `pageNo` | 1 | 고정 |

**응답 XML → 파싱 필드**

```
seq, title, img, price, startDate(YYYY-MM-DD),
endDate(YYYY-MM-DD), place, discountRate
```

---

## 4. 유틸 함수

### `src/utils/distance.ts`

| 함수 | 입력 | 출력 | 설명 |
|---|---|---|---|
| `haversineDistance(lat1, lng1, lat2, lng2)` | 좌표 4개 | `number` (km) | 두 좌표 간 거리 |
| `getBoundingBox(lat, lng, radiusKm)` | 좌표 + 반경 | `{latMin, latMax, lngMin, lngMax}` | API 파라미터용 바운딩 박스 |
| `formatDistance(km)` | `number` | `string` | `"1.2km"` / `"800m"` 표시용 |

---

## 5. 커스텀 훅

### `src/hooks/useGeolocation.ts`

- `navigator.geolocation.getCurrentPosition` 호출
- 성공: `locationStore.setLocation(lat, lng)`
- 실패: `locationStore.setError(message)` (권한 거부 / 타임아웃 / 위치 불가 메시지 분기)
- 옵션: `timeout: 10000`, `maximumAge: 60000`

### `src/hooks/useEvents.ts`

```
1. locationStore에서 lat, lng 읽기
2. getBoundingBox(lat, lng, 10) 로 바운딩 박스 계산
3. fetchCultureInfoArea + fetchTicketDiscounts 병렬 호출 (Promise.all)
4. 할인 매칭: ticketDiscounts를 title / place 기준 Map으로 인덱싱
   → cultureInfo 각 item에 대해 title 또는 place 일치 항목 탐색
5. 각 item에 haversineDistance 계산
6. 10km 초과 항목 필터링
7. 거리순 오름차순 정렬
8. Event[] 반환
```

반환값: `{ events, loading, error, refetch }`

### `src/hooks/useEventDetail.ts`

- `seq`(id)로 `/area2` 또는 이미 로드된 이벤트 목록에서 단건 조회
- 없는 id면 `null` 반환

---

## 6. 타입 정의 (`src/types/api.ts`)

```ts
// API 원본 응답
CultureInfoItem   // /area2 item 필드 그대로
TicketDiscountItem // /list item 필드 그대로

// 앱 내부 통합 타입
Event {
  id: string          // seq
  title: string
  place: string
  startDate: string   // YYYY-MM-DD (통일)
  endDate: string     // YYYY-MM-DD (통일)
  realmName: string
  area: string
  sigungu: string
  thumbnail: string
  lat: number
  lng: number
  distanceKm: number
  discount: DiscountInfo | null
}

DiscountInfo {
  discountRate: number
  price: string
  img: string
}
```

날짜 통일: 문화정보 `YYYYMMDD` → `YYYY-MM-DD` 변환 후 저장.

---

## 7. 컴포넌트 구조

```
src/
├── pages/
│   ├── Home.tsx          # 홈: 위치 수집 → 이벤트 리스트
│   ├── Detail.tsx        # 상세: seq 기반 단건 표시
│   └── SearchPage.tsx    # 검색: keyword 기반 필터링 리스트
│
└── components/
    ├── Header.tsx         # sticky, 로고 + 검색바
    ├── SearchBar.tsx      # 입력 → /search?q= 이동
    ├── EventCard.tsx      # 카드 1개 (썸네일, 제목, 장소, 거리, 할인 뱃지)
    ├── DiscountBadge.tsx  # 할인율 표시 뱃지
    ├── Pagination.tsx     # 페이지 번호 버튼
    ├── SkeletonCard.tsx   # 로딩 중 스켈레톤
    └── ErrorMessage.tsx   # 에러 + 재시도 버튼
```

### 각 컴포넌트 역할

**Header**
- sticky top-0, 배경 흰색
- 좌: 로고(클릭 시 `/` 이동), 우: SearchBar

**SearchBar**
- `<input>` + 돋보기 아이콘
- Enter 또는 버튼 클릭 시 `/search?q={keyword}` 로 navigate

**EventCard**
- props: `Event` 객체
- 클릭 시 `/detail/{id}` 이동
- 썸네일 이미지 (없으면 placeholder)
- 공연명, 장소, 날짜 범위, 거리, DiscountBadge(할인 있을 때만)

**DiscountBadge**
- props: `discountRate: number`
- 예: `20% 할인` 인디고 뱃지

**Pagination**
- props: `total, page, pageSize, onChange`
- 페이지당 20건

**SkeletonCard**
- EventCard 동일 레이아웃, 회색 pulse 애니메이션

**ErrorMessage**
- props: `message, onRetry`

---

## 8. 페이지별 구현 상세

### 8-1. Home (`/`)

```
마운트
  └─► useGeolocation() 호출
        ├─► loading=true → SkeletonCard × 6
        ├─► error → ErrorMessage (위치 권한 거부 안내)
        └─► 위치 수집 완료 → useEvents() 호출
              ├─► loading → SkeletonCard × 6
              ├─► error → ErrorMessage + 재시도 버튼
              └─► 성공 → EventCard 리스트
                    └─► filterStore.discountOnly=true → 할인 항목만 표시
                    └─► Pagination (20건/페이지)
```

헤더 고정, 할인 필터 토글 버튼 (헤더 아래).

### 8-2. SearchPage (`/search?q=`)

- URL `q` 파라미터로 keyword 읽기
- useEvents에 keyword 전달 → API 호출 시 `keyword` 파라미터 포함
- 결과 없음: "검색 결과가 없습니다" 메시지
- 뒤로가기 버튼 → `navigate(-1)`

### 8-3. Detail (`/detail/:id`)

- `id`(seq)로 이벤트 조회
  - Home에서 넘어온 경우: Zustand 또는 location state로 데이터 전달 검토
  - 직접 URL 접근: `/area2?keyword={id}` 또는 seq 검색
- 없는 id → "존재하지 않는 공연입니다" + 홈으로 버튼
- 표시: 포스터 이미지, 제목, 장소, 날짜, 가격, 분야, 할인 뱃지
- 예매 링크: culture.go.kr 상세 URL로 새 탭 이동

---

## 9. 할인 데이터 매칭 전략

할인티켓 API의 `title` / `place`는 문화정보 API와 표현이 다를 수 있음.

```
1차: title 완전 일치
2차: place 완전 일치
3차: title에 상대방 title이 포함(includes) 여부
```

매칭에 실패한 항목은 `discount: null` — 할인 뱃지 미표시.

---

## 10. 페이지네이션 전략

- 페이지당 20건
- API는 한 번에 최대 100건 → 클라이언트 슬라이싱
- totalCount > 100이면 병렬로 나머지 페이지 추가 호출 후 합산
- 실제 서울 10km 내 결과는 ~400건 → 최대 4회 병렬 호출

---

## 11. 에러 처리 정책

| 상황 | 처리 |
|---|---|
| 위치 권한 거부 | "위치 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요." + 재시도 불가 |
| 위치 타임아웃 | "위치 요청 시간이 초과되었습니다." + 재시도 버튼 |
| API 호출 실패 | "공연 정보를 불러오지 못했습니다." + 재시도 버튼 |
| 검색 결과 없음 | "검색 결과가 없습니다." 메시지 |
| 없는 상세 id | "존재하지 않는 공연입니다." + 홈으로 버튼 |

---

## 12. 구현 순서

| 순서 | 파일 | 내용 |
|---|---|---|
| 1 | `src/types/api.ts` | 타입 정의 |
| 2 | `src/utils/distance.ts` | Haversine, 바운딩 박스, 포맷 |
| 3 | `src/store/locationStore.ts` | 위치 상태 |
| 4 | `src/store/filterStore.ts` | 필터 상태 |
| 5 | `src/api/cultureInfo.ts` | 문화정보 API + XML 파싱 |
| 6 | `src/api/cultureTicket.ts` | 할인티켓 API + XML 파싱 |
| 7 | `src/hooks/useGeolocation.ts` | 위치 수집 훅 |
| 8 | `src/hooks/useEvents.ts` | 데이터 통합 훅 |
| 9 | `src/components/*` | 공통 컴포넌트 |
| 10 | `src/pages/Home.tsx` | 홈 화면 |
| 11 | `src/pages/Detail.tsx` | 상세 화면 |
| 12 | `src/pages/SearchPage.tsx` | 검색 화면 |
| 13 | `tests/` | Playwright 테스트 |
