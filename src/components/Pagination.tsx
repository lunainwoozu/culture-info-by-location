'use client'

interface Props {
  total: number
  page: number
  pageSize: number
  onChange: (page: number) => void
}

export default function Pagination({ total, page, pageSize, onChange }: Props) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const WINDOW = 5
  const half = Math.floor(WINDOW / 2)
  let start = Math.max(1, page - half)
  const end = Math.min(totalPages, start + WINDOW - 1)
  if (end - start < WINDOW - 1) start = Math.max(1, end - WINDOW + 1)

  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <nav className="flex items-center justify-center gap-1 py-6">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        이전
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            p === page
              ? 'bg-teal-500 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        다음
      </button>
    </nav>
  )
}
