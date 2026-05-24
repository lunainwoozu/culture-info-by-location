'use client'

interface Props {
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-gray-500 text-sm whitespace-pre-line">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 transition-colors"
        >
          다시 시도
        </button>
      )}
    </div>
  )
}
