'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  MdArrowBack, MdCalendarToday, MdPlace, MdTheaters,
  MdOpenInNew, MdImageNotSupported, MdLocalOffer, MdDirectionsWalk,
} from 'react-icons/md'
import { fetchCultureInfoDetail } from '@/api/cultureInfo'
import { fetchTicketDiscounts } from '@/api/cultureTicket'
import DiscountBadge from '@/components/DiscountBadge'
import FreeBadge from '@/components/FreeBadge'
import DetailSkeleton from '@/components/DetailSkeleton'
import { formatDistance, formatTransitTime } from '@/utils/distance'
import type { Event, TicketDiscountItem } from '@/types/api'

function toIsoDate(raw: string): string {
  if (raw.length === 8 && !raw.includes('-')) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }
  return raw
}

function findDiscount(title: string, place: string, tickets: TicketDiscountItem[]): TicketDiscountItem | undefined {
  return tickets.find(
    (t) =>
      t.title.trim() === title.trim() ||
      t.place.trim() === place.trim() ||
      title.trim().includes(t.title.trim()) ||
      t.title.trim().includes(title.trim()),
  )
}

export default function DetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return

    const run = async () => {
      setLoading(true)
      setNotFound(false)

      try {
        const [detail, tickets] = await Promise.all([
          fetchCultureInfoDetail(id),
          fetchTicketDiscounts(),
        ])

        if (!detail) { setNotFound(true); return }

        const discount = findDiscount(detail.title, detail.place, tickets)
        setEvent({
          id: detail.seq,
          title: detail.title,
          place: detail.place,
          startDate: toIsoDate(detail.startDate),
          endDate: toIsoDate(detail.endDate),
          realmName: detail.realmName,
          sigungu: detail.sigungu,
          thumbnail: detail.thumbnail,
          lat: detail.gpsY ? parseFloat(detail.gpsY) : null,
          lng: detail.gpsX ? parseFloat(detail.gpsX) : null,
          distanceKm: null,
          url: detail.url ?? '',
          price: detail.price ?? '',
          discount: discount
            ? { discountRate: Number(discount.discountRate), price: discount.price, img: discount.img }
            : null,
        })
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [id])

  if (loading) return <DetailSkeleton />

  if (notFound || !event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center">
        <p className="text-gray-500">존재하지 않는 공연입니다.</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 transition-colors"
        >
          홈으로
        </button>
      </div>
    )
  }

  const dateText = event.startDate === event.endDate
    ? event.startDate
    : `${event.startDate} ~ ${event.endDate}`

  const hasUrl = Boolean(event.url)
  const isFree = Boolean(event.price) && (event.price.includes('무료') || event.price === '0원' || event.price === '0')

  let priceText: string | null = null
  let discountSuffix: string | null = null
  if (!isFree) {
    if (event.price) {
      priceText = event.price
      if (event.discount) discountSuffix = `${event.discount.discountRate}% 할인`
    } else if (event.discount) {
      priceText = event.discount.price
      discountSuffix = `${event.discount.discountRate}% 할인`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <MdArrowBack size={20} />
            뒤로가기
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-screen-lg lg:px-6 lg:py-8">
        <div className="bg-white lg:rounded-2xl lg:shadow-sm overflow-hidden">
          <div className="lg:flex lg:items-stretch">
            <div className="w-full lg:w-2/5 shrink-0 bg-gray-100">
              {event.thumbnail ? (
                <img
                  src={event.thumbnail}
                  alt={event.title}
                  className="w-full h-64 sm:h-80 lg:h-full object-cover"
                />
              ) : (
                <div className="h-64 sm:h-80 lg:h-full flex items-center justify-center">
                  <MdImageNotSupported size={48} className="text-gray-300" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8 flex-1">
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  {isFree && <FreeBadge />}
                  {event.discount && !isFree && <DiscountBadge discountRate={event.discount.discountRate} />}
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900 leading-snug">
                  {event.title}
                </h1>
              </div>

              <dl className="flex-1 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <dt className="mt-0.5 shrink-0 text-gray-400"><MdPlace size={18} /></dt>
                  <dd className="text-gray-700">
                    {event.place}
                    {event.sigungu && (
                      <span className="ml-2 text-teal-500 font-medium">{event.sigungu}</span>
                    )}
                  </dd>
                </div>
                <div className="flex items-start gap-3">
                  <dt className="mt-0.5 shrink-0 text-gray-400"><MdCalendarToday size={18} /></dt>
                  <dd className="text-gray-700">{dateText}</dd>
                </div>
                <div className="flex items-start gap-3">
                  <dt className="mt-0.5 shrink-0 text-gray-400"><MdTheaters size={18} /></dt>
                  <dd className="text-gray-700">{event.realmName}</dd>
                </div>
                {priceText && (
                  <div className="flex items-start gap-3">
                    <dt className="mt-0.5 shrink-0 text-gray-400"><MdLocalOffer size={18} /></dt>
                    <dd className="text-gray-700">
                      {priceText}
                      {discountSuffix && (
                        <span className="ml-2 text-teal-600 font-medium">({discountSuffix})</span>
                      )}
                    </dd>
                  </div>
                )}
                {event.distanceKm !== null && (
                  <div className="flex items-start gap-3">
                    <dt className="mt-0.5 shrink-0 text-gray-400"><MdDirectionsWalk size={18} /></dt>
                    <dd className="text-gray-700 space-y-0.5">
                      <span>현재 위치로부터 {formatDistance(event.distanceKm)}</span>
                      <span className="block text-xs text-gray-500">{formatTransitTime(event.distanceKm)}</span>
                    </dd>
                  </div>
                )}
              </dl>

              <a
                href={hasUrl ? event.url : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!hasUrl}
                className={[
                  'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-colors',
                  hasUrl ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gray-300 pointer-events-none opacity-50',
                ].join(' ')}
              >
                상세 정보 이동
                <MdOpenInNew size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
