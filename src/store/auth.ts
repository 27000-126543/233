import { create } from 'zustand'
import { User, UserRole } from '@/types'
import { mockUsers } from '@/mock/users'

interface AuthState {
  user: User | null
  isLoggedIn: boolean
  login: (username: string, password: string, role: UserRole) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  login: (username, _password, role) => {
    const user = mockUsers.find(
      (u) => u.name === username && u.role === role
    )
    if (user) {
      set({ user, isLoggedIn: true })
      return true
    }
    return false
  },
  logout: () => {
    set({ user: null, isLoggedIn: false })
  },
}))
