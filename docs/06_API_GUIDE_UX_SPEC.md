# 06 — API 가이드 반영 + Detail 페이지 단일 로딩 UX 개선

**작성일**: 2026-05-18  
**상태**: 완료

---

## 배경

공식 API 가이드 문서 2종(`한눈에보는문화정보조회서비스_가이드.doc`, `문화릴레이티켓할인조회서비스_가이드.doc`) 분석 결과, CLAUDE.md의 API 섹션 일부가 실제 응답 스펙과 다르거나 누락된 것 확인.

또한 Detail 페이지가 홈 카드 데이터(`stateEvent`)를 즉시 렌더한 뒤 `detail2` API 결과로 url·price를 2차 업데이트하는 구조로, 예매 버튼이 로딩 완료 전후로 두 번 상태가 바뀌는 UX 문제 존재.

---

## 작업 1 — CLAUDE.md API 섹션 재작성

### 한눈에보는문화정보조회서비스

가이드 원문 Base URL: `https://apis.data.go.kr/B553457/cultrueinfo`  
코드 사용 URL: `https://apis.data.go.kr/B553457/cultureinfo` (정상 동작 확인, 유지)

| 항목 | 변경 전 | 변경 후 |
|---|---|---|
| area2 파라미터 | gps 범위·keyword·from/to만 기술 | `sido`, `sigungu`, `sortStdr`, `serviceTp` 추가 |
| detail2 엔드포인트 | 미문서화 | 신규 기술 — `url`, `price`, `phone`, `contents1`, `imgUrl`, `placeAddr`, `placeSeq` 포함 |
| 할인티켓 API 역할 | 불명확 | 이벤트 생성 아닌 할인 매칭 전용임을 명시 |
| 할인티켓 `/detail` | 미기술 | 참조 용도로 기술 (미구현, `/list`로 충분) |

**전체 엔드포인트 (cultureInfo):**

| 엔드포인트 | 설명 | 사용 |
|---|---|---|
| `GET /livelihood2` | 문화캘린더 목록 (keyword 검색) | 미사용 |
| `GET /period2` | 기간별 목록 (from/to + gps범위) | 미사용 |
| `GET /area2` | 지역별 목록 (gps 바운딩박스 기반) | ✅ 사용 |
| `GET /realm2` | 분야별 목록 (realmCode 기반) | 미사용 |
| `GET /detail2` | 상세 조회 (seq → url, price, phone 등) | ✅ 사용 |

---

## 작업 2 — TicketDiscountItem 정리

할인티켓 API의 역할이 cultureInfo 이벤트에 대한 할인 매칭임을 확인. 타입과 파서에서 실제 사용하지 않는 필드를 제거.

| 구분 | 변경 전 | 변경 후 |
|---|---|---|
| `TicketDiscountItem` 필드 | `seq`, `title`, `img`, `price`, `startDate`, `endDate`, `place`, `discountRate` (8개) | `title`, `place`, `img`, `price`, `discountRate` (5개) |
| 제거 이유 | `seq`·`startDate`·`endDate`는 매칭·뱃지 표시 어디서도 미참조 | — |

---

## 작업 3 — Detail 페이지 단일 로딩 UX 개선

### 문제

```
기존:
  stateEvent 즉시 렌더 (url·price 없음)
    → detail2 완료 후 url·price 2차 업데이트  ← 버튼 회색→녹색 변화 노출
```

### 해결 — useChatRoomData 패턴 적용

전체 카드 내용을 한 번에 불러와 UX를 상향시키기 위해 단일 loading 상태 채택.  
로딩 중에는 Detail 페이지 레이아웃과 동일한 구조의 `DetailSkeleton` 표시.

```
개선:
  loading = true → DetailSkeleton 표시
    → detail2 완료 후 stateEvent + detail2 병합
    → loading = false, 완전한 데이터로 1회 렌더
```

### DetailSkeleton 컴포넌트

- 위치: `src/components/DetailSkeleton.tsx`
- 실제 Detail 페이지 레이아웃(sticky 헤더 + 포스터 + 정보 행 4개 + 버튼)과 동일한 구조
- `animate-pulse` 적용, 기존 Detail.tsx 인라인 함수에서 독립 컴포넌트로 분리

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `CLAUDE.md` | area2 파라미터 보완; detail2 신규 문서화; 할인티켓 API 역할 명확화 |
| `src/types/api.ts` | `TicketDiscountItem` 미사용 필드(`seq`, `startDate`, `endDate`) 제거 |
| `src/api/cultureTicket.ts` | `parseItems` 사용 필드만 파싱하도록 정리 |
| `src/components/DetailSkeleton.tsx` | 신규 — Detail 페이지 레이아웃 스켈레톤 |
| `src/pages/Detail.tsx` | `detailLoading` 제거, 단일 `loading` 상태; DetailSkeleton import 사용 |
