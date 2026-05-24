# 07 — 버그 수정: 중복 카드 + HTML 엔티티 미디코딩

**작성일**: 2026-05-18  
**상태**: 완료

---

## Bug 1 — 같은 카드 N장 중복 표시

### 현상

홈 화면에서 동일한 이벤트 카드가 여러 장 반복 출력됨.

### 원인 분석

`fetchCultureInfoArea`는 첫 페이지 응답의 `totalCount`로 전체 페이지 수를 계산한 뒤 나머지 페이지를 병렬 호출한다.

```
totalPages = Math.ceil(totalCount / numOfRows)
```

**최초 구현 시**: `from`/`to` 파라미터 없이 바운딩 박스만으로 호출  
→ `totalCount` = 실제 반환 아이템 수 → 페이지네이션 정상

**"상세 페이지 재설계" 작업(`docs/05_DETAIL_REDESIGN_SPEC.md`) 시**:  
`/area2`에 `from`/`to`(오늘~3개월) 날짜 필터 파라미터 추가  
→ API가 `totalCount`를 날짜 필터 **적용 전** 바운딩 박스 전체 건수로 반환  
→ 실제 아이템은 날짜 필터로 대폭 감소하지만 `totalPages`는 과대 계산  
→ 추가 호출된 각 페이지가 동일한 소수의 아이템을 반복 반환 → 중복 카드 발생

### 수정 방법

두 가지 방어 로직을 `fetchCultureInfoArea`에 추가한다.

1. **Early termination**: 1페이지 결과 수 < `numOfRows`이면 실제 마지막 페이지로 판단, 추가 페이지 호출 중단
2. **seq 기준 중복 제거**: 멀티 페이지 결과를 합친 후 `seq`로 dedup (방어 레이어)

---

## Bug 2 — 제목 내 HTML 엔티티 미디코딩 (`&lt;` 등)

### 현상

이벤트 카드 및 상세 페이지 제목에 `<`, `>` 대신 `&lt;`, `&gt;` 가 그대로 출력됨.

### 원인 분석

API XML 응답의 텍스트 필드(title 등)에 HTML 엔티티가 이중 인코딩되어 있음.

```
API 전송: &amp;lt;공연명&amp;gt;
XML 파서 textContent 결과: &lt;공연명&gt;  ← 1회만 디코딩됨
화면 출력: &lt;공연명&gt;               ← 엔티티 코드 그대로 노출
```

`DOMParser`의 `textContent`는 XML 엔티티를 1회만 디코딩하므로, 이중 인코딩된 값은 HTML 엔티티가 남는다.

### 수정 방법

`parseItems`의 `t()` 헬퍼에 브라우저 내장 HTML 엔티티 디코딩을 추가한다.

```typescript
// textarea.innerHTML 할당 시 브라우저가 HTML 엔티티를 자동 디코딩
const decode = (s: string) => {
  const ta = document.createElement('textarea')
  ta.innerHTML = s
  return ta.value
}
const t = (tag: string) => decode(el.querySelector(tag)?.textContent ?? '')
```

---

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/api/cultureInfo.ts` | `decodeEntities` 함수 추가 + `parseItems` `t()` 헬퍼에 적용 (Bug 2); `fetchCultureInfoArea`에 early termination + seq dedup 추가 (Bug 1) |
