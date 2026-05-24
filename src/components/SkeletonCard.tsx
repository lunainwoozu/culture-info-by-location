'use client'

export default function SkeletonCard() {
  return (
    <div className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3 animate-pulse">
      <div className="w-24 shrink-0 rounded-lg bg-gray-200" />
      <div className="flex flex-1 flex-col justify-between py-1">
        <div className="space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="h-3 w-1/2 rounded bg-gray-200" />
          <div className="h-3 w-2/5 rounded bg-gray-200" />
        </div>
        <div className="h-5 w-14 rounded-full bg-gray-200" />
      </div>
    </div>
  )
}
