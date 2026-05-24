import { create } from 'zustand'

interface LocationStore {
  lat: number | null
  lng: number | null
  loading: boolean
  error: string | null
  setLocation: (lat: number, lng: number) => void
  setError: (error: string) => void
  setLoading: (loading: boolean) => void
}

export const useLocationStore = create<LocationStore>((set) => ({
  lat: null,
  lng: null,
  loading: false,
  error: null,
  setLocation: (lat, lng) => set({ lat, lng, error: null }),
  setError: (error) => set({ error, loading: false }),
  setLoading: (loading) => set({ loading }),
}))
