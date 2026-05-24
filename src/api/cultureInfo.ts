import type { CultureInfoItem } from '../types/api'

const BASE = 'https://apis.data.go.kr/B553457/cultureinfo'
const KEY = process.env.NEXT_PUBLIC_CULTURE_API_KEY as string

function decodeEntities(s: string): string {
  const ta = document.createElement('textarea')
  ta.innerHTML = s
  return ta.value
}

function parseItems(xml: string): CultureInfoItem[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  return Array.from(doc.querySelectorAll('item')).map((el) => {
    const t = (tag: string) => decodeEntities(el.querySelector(tag)?.textContent ?? '')
    return {
      seq: t('seq'),
      title: t('title'),
      place: t('place'),
      startDate: t('startDate'),
      endDate: t('endDate'),
      realmName: t('realmName'),
      area: t('area'),
      sigungu: t('sigungu'),
      thumbnail: t('thumbnail') || t('imgUrl'),
      gpsX: t('gpsX'),
      gpsY: t('gpsY'),
      url: t('url'),
      price: t('price'),
    }
  })
}

function parseTotalCount(xml: string): number {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  return Number(doc.querySelector('totalCount')?.textContent ?? 0)
}

export interface AreaParams {
  lngMin?: number
  lngMax?: number
  latMin?: number
  latMax?: number
  keyword?: string
}

function toApiDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

async function fetchPage(params: AreaParams & { pageNo: number; numOfRows: number }): Promise<{ items: CultureInfoItem[]; totalCount: number }> {
  const today = new Date()
  const threeMoLater = new Date(today)
  threeMoLater.setMonth(threeMoLater.getMonth() + 3)

  const p = new URLSearchParams({
    serviceKey: KEY,
    numOfRows: String(params.numOfRows),
    pageNo: String(params.pageNo),
    from: toApiDate(today),
    to: toApiDate(threeMoLater),
  })
  if (params.lngMin !== undefined) p.set('gpsxfrom', String(params.lngMin))
  if (params.lngMax !== undefined) p.set('gpsxto', String(params.lngMax))
  if (params.latMin !== undefined) p.set('gpsyfrom', String(params.latMin))
  if (params.latMax !== undefined) p.set('gpsyto', String(params.latMax))
  if (params.keyword) p.set('keyword', params.keyword)

  const res = await fetch(`${BASE}/area2?${p}`)
  if (!res.ok) throw new Error(`문화정보 API 오류: ${res.status}`)
  const xml = await res.text()
  return { items: parseItems(xml), totalCount: parseTotalCount(xml) }
}

export async function fetchCultureInfoDetail(seq: string): Promise<CultureInfoItem | null> {
  const p = new URLSearchParams({ serviceKey: KEY, seq })
  const res = await fetch(`${BASE}/detail2?${p}`)
  if (!res.ok) throw new Error(`문화정보 상세 API 오류: ${res.status}`)
  const xml = await res.text()
  const items = parseItems(xml)
  return items[0] ?? null
}

export async function fetchCultureInfoArea(params: AreaParams): Promise<CultureInfoItem[]> {
  const NUM_OF_ROWS = 100
  const first = await fetchPage({ ...params, pageNo: 1, numOfRows: NUM_OF_ROWS })
  const totalPages = Math.ceil(first.totalCount / NUM_OF_ROWS)

  if (totalPages <= 1 || first.items.length < NUM_OF_ROWS) return first.items

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      fetchPage({ ...params, pageNo: i + 2, numOfRows: NUM_OF_ROWS }),
    ),
  )

  const all = [...first.items, ...rest.flatMap((r) => r.items)]
  const seen = new Set<string>()
  return all.filter((item) => {
    if (seen.has(item.seq)) return false
    seen.add(item.seq)
    return true
  })
}
