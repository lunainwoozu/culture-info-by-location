import { NextResponse } from 'next/server'
import { haversineDistance, getBoundingBox } from '../../../utils/distance'

const BASE = 'http://www.khs.go.kr/cha'
const PAGE_UNIT = 100
const RADIUS_KM = 10

function parseXmlField(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`)
  const m = xml.match(re)
  return m ? m[1].trim() : ''
}

function parseXmlItems(xml: string): Record<string, string>[] {
  const items: Record<string, string>[] = []
  const itemRe = /<item>([\s\S]*?)<\/item>/g
  let itemMatch
  while ((itemMatch = itemRe.exec(xml)) !== null) {
    const block = itemMatch[1]
    const item: Record<string, string> = {}
    const fieldRe = /<(\w+)>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/\1>/g
    let fieldMatch
    while ((fieldMatch = fieldRe.exec(block)) !== null) {
      item[fieldMatch[1]] = fieldMatch[2].trim()
    }
    items.push(item)
  }
  return items
}

async function fetchListPage(ccbaCtcd: string, pageIndex: number): Promise<string> {
  const res = await fetch(
    `${BASE}/SearchKindOpenapiList.do?ccbaCtcd=${ccbaCtcd}&pageUnit=${PAGE_UNIT}&pageIndex=${pageIndex}`,
    { next: { revalidate: 3600 } },
  )
  return res.text()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    if (type === 'list') {
      const ccbaCtcd = searchParams.get('ccbaCtcd') ?? '11'
      const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
      const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null

      const firstXml = await fetchListPage(ccbaCtcd, 1)
      const totalCnt = parseInt(parseXmlField(firstXml, 'totalCnt') || '0')
      const totalPages = Math.ceil(totalCnt / PAGE_UNIT)

      let rawItems = parseXmlItems(firstXml)

      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            fetchListPage(ccbaCtcd, i + 2).then(parseXmlItems),
          ),
        )
        rawItems = [...rawItems, ...rest.flat()]
      }

      const allItems = rawItems
        .filter((item) => item.ccbaCncl !== 'Y')
        .map((item) => ({
          id: `${item.ccbaKdcd}_${item.ccbaAsno}_${item.ccbaCtcd}`,
          name: item.ccbaMnm1 ?? '',
          ccbaKdcd: item.ccbaKdcd ?? '',
          ccbaAsno: item.ccbaAsno ?? '',
          ccbaCtcd: item.ccbaCtcd ?? '',
          sigungu: item.ccsiName ?? '',
          category: item.ccmaName ?? '',
          latitude: parseFloat(item.latitude ?? '0'),
          longitude: parseFloat(item.longitude ?? '0'),
          distanceKm: null as number | null,
          imageUrl: null as string | null,
        }))
        .filter((item) => item.latitude !== 0 || item.longitude !== 0)

      if (lat !== null && lng !== null) {
        const box = getBoundingBox(lat, lng, RADIUS_KM)
        const nearby = allItems
          .filter(
            (item) =>
              item.latitude >= box.latMin &&
              item.latitude <= box.latMax &&
              item.longitude >= box.lngMin &&
              item.longitude <= box.lngMax,
          )
          .map((item) => ({
            ...item,
            distanceKm: haversineDistance(lat, lng, item.latitude, item.longitude),
          }))
          .filter((item) => (item.distanceKm ?? 0) <= RADIUS_KM)
          .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))

        return NextResponse.json({ items: nearby })
      }

      return NextResponse.json({ items: allItems })
    }

    if (type === 'detail') {
      const ccbaKdcd = searchParams.get('ccbaKdcd') ?? ''
      const ccbaAsno = searchParams.get('ccbaAsno') ?? ''
      const ccbaCtcd = searchParams.get('ccbaCtcd') ?? ''

      const res = await fetch(
        `${BASE}/SearchKindOpenapiDt.do?ccbaKdcd=${ccbaKdcd}&ccbaAsno=${ccbaAsno}&ccbaCtcd=${ccbaCtcd}`,
        { next: { revalidate: 86400 } },
      )
      const xml = await res.text()
      const latitude = parseFloat(parseXmlField(xml, 'latitude') || '0')
      const longitude = parseFloat(parseXmlField(xml, 'longitude') || '0')
      const items = parseXmlItems(xml)
      const item = items[0] ?? {}

      return NextResponse.json({
        id: `${ccbaKdcd}_${ccbaAsno}_${ccbaCtcd}`,
        name: item.ccbaMnm1 ?? '',
        ccbaKdcd,
        ccbaAsno,
        ccbaCtcd,
        sigungu: item.ccsiName ?? '',
        category: item.ccmaName ?? '',
        latitude,
        longitude,
        content: item.content ?? '',
        address: item.ccbaLcad ?? '',
        distanceKm: null,
        imageUrl: null,
      })
    }

    if (type === 'image') {
      const ccbaKdcd = searchParams.get('ccbaKdcd') ?? ''
      const ccbaAsno = searchParams.get('ccbaAsno') ?? ''
      const ccbaCtcd = searchParams.get('ccbaCtcd') ?? ''

      const res = await fetch(
        `${BASE}/SearchImageOpenapi.do?ccbaKdcd=${ccbaKdcd}&ccbaAsno=${ccbaAsno}&ccbaCtcd=${ccbaCtcd}&pageUnit=1&pageIndex=1`,
        { next: { revalidate: 86400 } },
      )
      const xml = await res.text()
      const items = parseXmlItems(xml)
      const imageUrl = items[0]?.imageUrl || null

      return NextResponse.json({ imageUrl })
    }

    return NextResponse.json({ error: 'type 파라미터가 필요합니다.' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: '문화재 API 호출 실패' }, { status: 500 })
  }
}
