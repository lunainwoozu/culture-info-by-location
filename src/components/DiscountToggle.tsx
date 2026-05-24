interface Props {
  checked: boolean
  onChange: () => void
}

export default function DiscountToggle({ checked, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span className="text-sm font-medium text-gray-700">할인만 보기</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`
          relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent
          transition-colors duration-200 focus:outline-none focus-visible:ring-2
          focus-visible:ring-teal-500 focus-visible:ring-offset-2
          ${checked ? 'bg-teal-500' : 'bg-gray-200'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow
            transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </label>
  )
}
