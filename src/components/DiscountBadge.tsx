'use client'

interface Props {
  discountRate: number
}

export default function DiscountBadge({ discountRate }: Props) {
  return (
    <span className="inline-block rounded px-1.5 py-0.5 text-xs font-semibold text-white bg-teal-500">
      {discountRate}% 할인
    </span>
  )
}
