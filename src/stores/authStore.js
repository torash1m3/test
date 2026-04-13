import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (credentials) => {
        // Mock login — будет заменён на реальный API
        const mockUser = {
          id: crypto.randomUUID(),
          username: credentials.username,
          email: credentials.email || `${credentials.username}@neoforge.dev`,
          avatar: null,
          pcSpecs: null,
          badges: [],
          createdAt: new Date().toISOString(),
        }
        set({ user: mockUser, isAuthenticated: true })
      },

      register: (data) => {
        const newUser = {
          id: crypto.randomUUID(),
          username: data.username,
          email: data.email,
          avatar: null,
          pcSpecs: null,
          badges: [],
          createdAt: new Date().toISOString(),
        }
        set({ user: newUser, isAuthenticated: true })
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      },

      updateProfile: (updates) => {
        const currentUser = get().user
        if (!currentUser) return
        set({ user: { ...currentUser, ...updates } })
      },

      updatePcSpecs: (specs) => {
        const currentUser = get().user
        if (!currentUser) return
        set({ user: { ...currentUser, pcSpecs: specs } })
      },
    }),
    {
      name: 'neoforge-auth',
    }
  )
)

export default useAuthStore
