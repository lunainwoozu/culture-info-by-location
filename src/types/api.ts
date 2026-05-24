interface EventBase {
  title: string
  place: string
  realmName: string
  sigungu: string
  thumbnail: string
  url: string
  price: string
}

export interface CultureInfoItem extends EventBase {
  seq: string
  startDate: string // YYYYMMDD
  endDate: string   // YYYYMMDD
  area: string      // API 응답 전용 — Event로 매핑하지 않음
  gpsX: string      // 경도
  gpsY: string      // 위도
}

export interface TicketDiscountItem {
  title: string
  place: string
  img: string
  price: string
  discountRate: string
}

export interface DiscountInfo extends Pick<TicketDiscountItem, 'price' | 'img'> {
  discountRate: number  // string에서 파싱
}

export interface Event extends EventBase {
  id: string
  startDate: string         // YYYY-MM-DD
  endDate: string           // YYYY-MM-DD
  lat: number | null        // 위치 없이 키워드 검색 시 null
  lng: number | null
  distanceKm: number | null // null이면 거리 미표시
  discount: DiscountInfo | null
}
