import { create } from 'zustand'

interface User {
  email: string
}

interface AuthState {
  user: User | null
  login: (email: string) => void
  logout: () => void
}

const SESSION_KEY = 'auth_user'

function loadSession(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadSession(),
  login: (email) => {
    const user = { email }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    set({ user })
  },
  logout: () => {
    sessionStorage.removeItem(SESSION_KEY)
    set({ user: null })
  },
}))
