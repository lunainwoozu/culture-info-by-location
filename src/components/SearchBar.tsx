import { useState } from 'react'
import { MdSearch } from 'react-icons/md'

interface Props {
  defaultValue?: string
  onSearch: (keyword: string) => void
}

export default function SearchBar({ defaultValue = '', onSearch }: Props) {
  const [value, setValue] = useState(defaultValue)

  const handleSubmit = () => {
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-400 transition-all">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="공연·전시 검색"
        className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
      />
      <button
        type="button"
        onClick={handleSubmit}
        aria-label="검색"
        className="text-gray-400 hover:text-teal-500 transition-colors"
      >
        <MdSearch size={20} />
      </button>
    </div>
  )
}
