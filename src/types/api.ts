export interface CultureInfoItem {
  seq: string
  serviceName: string
  title: string
  place: string
  startDate: string // YYYYMMDD
  endDate: string   // YYYYMMDD
  realmName: string
  area: string
  sigungu: string
  thumbnail: string
  gpsX: string // 경도
  gpsY: string // 위도
  url: string
  price: string
}

export interface TicketDiscountItem {
  title: string
  place: string
  img: string
  price: string
  discountRate: string
}

export interface DiscountInfo {
  discountRate: number
  price: string
  img: string
}

export interface Event {
  id: string
  title: string
  place: string
  startDate: string     // YYYY-MM-DD
  endDate: string       // YYYY-MM-DD
  realmName: string
  area: string
  sigungu: string
  thumbnail: string
  lat: number | null    // 위치 없이 키워드 검색 시 null
  lng: number | null
  distanceKm: number | null  // null이면 거리 미표시
  discount: DiscountInfo | null
  url: string
  price: string
}
