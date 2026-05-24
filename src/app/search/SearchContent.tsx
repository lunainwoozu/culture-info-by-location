'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MdArrowBack } from 'react-icons/md'
import Header from '@/components/Header'
import DiscountToggle from '@/components/DiscountToggle'
import EventCard from '@/components/EventCard'
import SkeletonCard from '@/components/SkeletonCard'
import ErrorMessage from '@/components/ErrorMessage'
import Pagination from '@/components/Pagination'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useEvents } from '@/hooks/useEvents'

const PAGE_SIZE = 20

export default function SearchContent() {
  useGeolocation()

  const searchParams = useSearchParams()
  const router = useRouter()
  const keyword = searchParams.get('q') ?? ''

  const { events, loading, error, refetch } = useEvents(keyword)
  const [page, setPage] = useState(1)
  const [discountOnly, setDiscountOnly] = useState(false)

  const filtered = discountOnly ? events.filter((e) => e.discount !== null) : events
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleToggle = () => {
    setDiscountOnly((v) => !v)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header discountOnly={discountOnly} onToggleDiscount={handleToggle} />

      <div className="lg:hidden border-b border-gray-100 bg-gray-50 px-4 py-2 sm:px-6 flex justify-end">
        <DiscountToggle checked={discountOnly} onChange={handleToggle} />
      </div>

      <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <MdArrowBack size={18} />
            뒤로
          </button>
          <span className="text-sm text-gray-700">
            &quot;{keyword}&quot; 검색 결과 {filtered.length}건
          </span>
        </div>

        {error ? (
          <ErrorMessage message={error} onRetry={refetch} />
        ) : loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <ErrorMessage
            message={
              discountOnly
                ? '할인 중인 검색 결과가 없습니다.'
                : `"${keyword}"에 대한 검색 결과가 없습니다.`
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {paged.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <Pagination
              total={filtered.length}
              page={page}
              pageSize={PAGE_SIZE}
              onChange={(p) => { setPage(p); window.scrollTo(0, 0) }}
            />
          </>
        )}
      </main>
    </div>
  )
}
