import { create } from 'zustand'

interface FilterStore {
  discountOnly: boolean
  keyword: string
  toggleDiscountOnly: () => void
  setKeyword: (keyword: string) => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  discountOnly: false,
  keyword: '',
  toggleDiscountOnly: () => set((s) => ({ discountOnly: !s.discountOnly })),
  setKeyword: (keyword) => set({ keyword }),
}))
