import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CATEGORY_SCHEMAS } from '@/features/builder/schemas'

const COMPONENT_STATUSES = ['planned', 'ordered', 'purchased', 'delivered']

const CATEGORIES = Object.keys(CATEGORY_SCHEMAS)

const useBuilderStore = create(
  persist(
    (set, get) => ({
      builds: [],
      activeBuildId: null,

      categories: CATEGORIES,

      categoryLabels: Object.fromEntries(
        CATEGORIES.map((key) => [key, CATEGORY_SCHEMAS[key].label])
      ),

      // ──── Build CRUD ────
      createBuild: (name) => {
        const build = {
          id: crypto.randomUUID(),
          name,
          components: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          builds: [...state.builds, build],
          activeBuildId: build.id,
        }))
        return build.id
      },

      deleteBuild: (buildId) => {
        set((state) => ({
          builds: state.builds.filter((b) => b.id !== buildId),
          activeBuildId:
            state.activeBuildId === buildId ? null : state.activeBuildId,
        }))
      },

      renameBuild: (buildId, name) => {
        set((state) => ({
          builds: state.builds.map((b) =>
            b.id === buildId ? { ...b, name, updatedAt: new Date().toISOString() } : b
          ),
        }))
      },

      setActiveBuild: (buildId) => {
        set({ activeBuildId: buildId })
      },

      // ──── Component CRUD ────
      addComponent: (buildId, component) => {
        const newComponent = {
          id: crypto.randomUUID(),
          name: component.name,
          category: component.category,
          price: Number(component.price) || 0,
          status: 'planned',
          notes: component.notes || '',
          attrs: component.attrs || {},
          addedAt: new Date().toISOString(),
        }
        set((state) => ({
          builds: state.builds.map((b) =>
            b.id === buildId
              ? {
                  ...b,
                  components: [...b.components, newComponent],
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
        }))
        return newComponent.id
      },

      updateComponent: (buildId, componentId, updates) => {
        set((state) => ({
          builds: state.builds.map((b) =>
            b.id === buildId
              ? {
                  ...b,
                  components: b.components.map((c) =>
                    c.id === componentId ? { ...c, ...updates } : c
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
        }))
      },

      removeComponent: (buildId, componentId) => {
        set((state) => ({
          builds: state.builds.map((b) =>
            b.id === buildId
              ? {
                  ...b,
                  components: b.components.filter((c) => c.id !== componentId),
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
        }))
      },

      cycleComponentStatus: (buildId, componentId) => {
        set((state) => ({
          builds: state.builds.map((b) => {
            if (b.id !== buildId) return b
            return {
              ...b,
              components: b.components.map((c) => {
                if (c.id !== componentId) return c
                const currentIdx = COMPONENT_STATUSES.indexOf(c.status)
                const nextIdx = (currentIdx + 1) % COMPONENT_STATUSES.length
                return { ...c, status: COMPONENT_STATUSES[nextIdx] }
              }),
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      moveComponent: (buildId, activeId, overId) => {
        set((state) => ({
          builds: state.builds.map((b) => {
            if (b.id !== buildId) return b
            const components = [...b.components]
            const fromIndex = components.findIndex((c) => c.id === activeId)
            const toIndex = components.findIndex((c) => c.id === overId)
            if (fromIndex === -1 || toIndex === -1) return b
            const [moved] = components.splice(fromIndex, 1)
            components.splice(toIndex, 0, moved)
            return { ...b, components, updatedAt: new Date().toISOString() }
          }),
        }))
      },

      moveComponentToCategory: (buildId, componentId, newCategory) => {
        set((state) => ({
          builds: state.builds.map((b) =>
            b.id === buildId
              ? {
                  ...b,
                  components: b.components.map((c) =>
                    c.id === componentId ? { ...c, category: newCategory } : c
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
        }))
      },

      // ──── Selectors ────
      getActiveBuild: () => {
        const state = get()
        return state.builds.find((b) => b.id === state.activeBuildId) || null
      },

      getComponentsByCategory: (buildId, category) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) return []
        return build.components.filter((c) => c.category === category)
      },

      getTotalPrice: (buildId) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) return 0
        return build.components.reduce((sum, c) => sum + (c.price || 0), 0)
      },

      getCategoryPrice: (buildId, category) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) return 0
        return build.components
          .filter((c) => c.category === category)
          .reduce((sum, c) => sum + (c.price || 0), 0)
      },

      getProgress: (buildId) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build || build.components.length === 0) return 0
        const delivered = build.components.filter(
          (c) => c.status === 'delivered'
        ).length
        return Math.round((delivered / build.components.length) * 100)
      },

      getStatusCounts: (buildId) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) return { planned: 0, ordered: 0, purchased: 0, delivered: 0 }
        const counts = { planned: 0, ordered: 0, purchased: 0, delivered: 0 }
        for (const c of build.components) {
          counts[c.status] = (counts[c.status] || 0) + 1
        }
        return counts
      },
    }),
    {
      name: 'neoforge-builder',
    }
  )
)

export default useBuilderStore
