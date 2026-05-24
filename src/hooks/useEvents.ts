import { useState, useEffect, useCallback } from 'react'
import { fetchCultureInfoArea } from '../api/cultureInfo'
import { fetchTicketDiscounts } from '../api/cultureTicket'
import { getBoundingBox, haversineDistance } from '../utils/distance'
import { useLocationStore } from '../store/locationStore'
import type { Event, TicketDiscountItem } from '../types/api'

const RADIUS_KM = 10

function toIsoDate(raw: string): string {
  if (raw.length === 8 && !raw.includes('-')) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }
  return raw
}

function buildDiscountMap(tickets: TicketDiscountItem[]): Map<string, TicketDiscountItem> {
  const map = new Map<string, TicketDiscountItem>()
  for (const t of tickets) {
    map.set(t.title.trim(), t)
    map.set(t.place.trim(), t)
  }
  return map
}

function findDiscount(
  title: string,
  place: string,
  map: Map<string, TicketDiscountItem>,
): TicketDiscountItem | undefined {
  return (
    map.get(title.trim()) ??
    map.get(place.trim()) ??
    [...map.keys()].reduce<TicketDiscountItem | undefined>((found, key) => {
      if (found) return found
      if (title.trim().includes(key) || key.includes(title.trim())) return map.get(key)
      return undefined
    }, undefined)
  )
}

export function useEvents(keyword?: string) {
  const { lat, lng } = useLocationStore()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasLocation = lat !== null && lng !== null
  const hasKeyword = Boolean(keyword?.trim())

  const load = useCallback(async () => {
    // 위치도 없고 키워드도 없으면 호출하지 않음
    if (!hasLocation && !hasKeyword) return

    setLoading(true)
    setError(null)

    try {
      const areaParams = hasLocation
        ? getBoundingBox(lat!, lng!, RADIUS_KM)  // 위치 있으면 바운딩 박스
        : {}                                      // 없으면 키워드만

      const [cultureItems, tickets] = await Promise.all([
        fetchCultureInfoArea({ ...areaParams, keyword }),
        fetchTicketDiscounts(),
      ])

      const discountMap = buildDiscountMap(tickets)
      const today = new Date().toISOString().slice(0, 10)

      const result: Event[] = cultureItems
        .filter((item) => toIsoDate(item.endDate) >= today)
        .map((item) => {
          const venueLat = item.gpsY ? parseFloat(item.gpsY) : null
          const venueLng = item.gpsX ? parseFloat(item.gpsX) : null
          const distanceKm =
            hasLocation && venueLat !== null && venueLng !== null
              ? haversineDistance(lat!, lng!, venueLat, venueLng)
              : null
          const matched = findDiscount(item.title, item.place, discountMap)

          return {
            id: item.seq,
            title: item.title,
            place: item.place,
            startDate: toIsoDate(item.startDate),
            endDate: toIsoDate(item.endDate),
            realmName: item.realmName,
            area: item.area,
            sigungu: item.sigungu,
            thumbnail: item.thumbnail,
            lat: venueLat,
            lng: venueLng,
            distanceKm,
            url: '',
            price: '',
            discount: matched
              ? {
                  discountRate: Number(matched.discountRate),
                  price: matched.price,
                  img: matched.img,
                }
              : null,
          }
        })
        .filter((e) => e.distanceKm === null || e.distanceKm <= RADIUS_KM)
        .sort((a, b) =>
          a.distanceKm !== null && b.distanceKm !== null
            ? a.distanceKm - b.distanceKm           // 위치 있으면 거리순
            : a.startDate.localeCompare(b.startDate) // 없으면 날짜순
        )

      setEvents(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '공연 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [lat, lng, keyword, hasLocation, hasKeyword])

  useEffect(() => {
    load()
  }, [load])

  return { events, loading, error, refetch: load }
}
