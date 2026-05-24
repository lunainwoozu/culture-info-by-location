import { useNavigate } from 'react-router-dom'
import { MdTheaters } from 'react-icons/md'
import SearchBar from './SearchBar'
import DiscountToggle from './DiscountToggle'

interface Props {
  discountOnly?: boolean
  onToggleDiscount?: () => void
}

export default function Header({ discountOnly = false, onToggleDiscount }: Props) {
  const navigate = useNavigate()

  const handleSearch = (keyword: string) => {
    navigate(`/search?q=${encodeURIComponent(keyword)}`)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* 로고 */}
        <button
          type="button"
          onClick={() => navigate('/')}
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
      </div>
    </header>
  )
}
