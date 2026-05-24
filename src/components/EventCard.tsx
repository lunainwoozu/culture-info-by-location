'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MdImageNotSupported } from 'react-icons/md'
import type { Event } from '../types/api'
import { fetchCultureInfoDetail } from '../api/cultureInfo'
import { formatDistance } from '../utils/distance'
import DiscountBadge from './DiscountBadge'
import FreeBadge from './FreeBadge'

interface Props {
  event: Event
}

function formatDateRange(start: string, end: string): string {
  if (start === end) return start
  return `${start} ~ ${end}`
}

export default function EventCard({ event }: Props) {
  const router = useRouter()
  const [price, setPrice] = useState(event.price)

  useEffect(() => {
    if (price) return
    let cancelled = false
    fetchCultureInfoDetail(event.id)
      .then((d) => { if (!cancelled && d?.price) setPrice(d.price) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [event.id, price])

  const isFree = Boolean(price) && (price.includes('무료') || price === '0원' || price === '0')

  return (
    <article
      onClick={() => router.push(`/detail/${event.id}`)}
      className="flex cursor-pointer gap-0 rounded-xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* 썸네일 */}
      <div className="relative w-24 sm:w-28 shrink-0 bg-gray-100">
        {event.thumbnail ? (
          <img
            src={event.thumbnail}
            alt={event.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <MdImageNotSupported size={28} />
          </div>
        )}
        {(isFree || event.discount) && (
          <div className="absolute bottom-1.5 left-1.5 flex flex-col gap-0.5">
            {isFree && <FreeBadge />}
            {event.discount && <DiscountBadge discountRate={event.discount.discountRate} />}
          </div>
        )}
      </div>

      {/* 텍스트 */}
      <div className="flex flex-1 flex-col justify-between p-3 min-w-0">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
            {event.title}
          </h3>
          <p className="text-xs text-gray-500 truncate">
            {event.place}
            {event.distanceKm !== null && ` · ${formatDistance(event.distanceKm)}`}
          </p>
          <p className="text-xs text-gray-400">
            {formatDateRange(event.startDate, event.endDate)}
          </p>
        </div>
        <div className="mt-2">
          <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {event.realmName}
          </span>
        </div>
      </div>
    </article>
  )
}
