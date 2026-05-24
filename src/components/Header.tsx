'use client'

import { useRouter } from 'next/navigation'
import { MdTheaters } from 'react-icons/md'
import SearchBar from './SearchBar'
import DiscountToggle from './DiscountToggle'
import { useAuthStore } from '@/store/authStore'

interface Props {
  discountOnly?: boolean
  onToggleDiscount?: () => void
}

export default function Header({ discountOnly = false, onToggleDiscount }: Props) {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleSearch = (keyword: string) => {
    router.push(`/search?q=${encodeURIComponent(keyword)}`)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* 로고 */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex shrink-0 items-center gap-1.5 text-teal-500 hover:text-teal-600 transition-colors"
        >
          <MdTheaters size={24} />
          <span className="hidden font-bold text-gray-900 sm:inline">오늘 문화일정</span>
        </button>

        {/* 검색바 */}
        <div className="flex-1">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* 필터 토글 — desktop만 헤더에 표시 */}
        {onToggleDiscount && (
          <div className="hidden lg:flex shrink-0">
            <DiscountToggle checked={discountOnly} onChange={onToggleDiscount} />
          </div>
        )}

        {/* 로그인/로그아웃 */}
        <div className="shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() => logout()}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              로그아웃
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="rounded-lg bg-teal-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-600 transition-colors"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
