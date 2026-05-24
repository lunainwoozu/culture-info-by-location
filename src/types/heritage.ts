export interface HeritageItem {
  id: string
  name: string
  ccbaKdcd: string
  ccbaAsno: string
  ccbaCtcd: string
  sigungu: string
  category: string
  latitude: number
  longitude: number
  distanceKm: number | null
  imageUrl: string | null
}

export interface HeritageDetail extends HeritageItem {
  content: string
  address: string
}
