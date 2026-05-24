import type { TicketDiscountItem } from '../types/api'

const BASE = 'https://apis.data.go.kr/B553457/nopenapi/rest/ticketdiscounts'
const KEY = import.meta.env.VITE_CULTURE_API_KEY as string

function parseItems(xml: string): TicketDiscountItem[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  return Array.from(doc.querySelectorAll('item')).map((el) => {
    const t = (tag: string) => el.querySelector(tag)?.textContent ?? ''
    return {
      title: t('title'),
      place: t('place'),
      img: t('img'),
      price: t('price'),
      discountRate: t('discountRate'),
    }
  })
}

export async function fetchTicketDiscounts(): Promise<TicketDiscountItem[]> {
  const p = new URLSearchParams({
    serviceKey: KEY,
    numOfRows: '500',
    pageNo: '1',
  })
  const res = await fetch(`${BASE}/list?${p}`)
  if (!res.ok) throw new Error(`할인티켓 API 오류: ${res.status}`)
  const xml = await res.text()
  return parseItems(xml)
}
