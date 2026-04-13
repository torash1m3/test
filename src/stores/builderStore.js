import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Статусы комплектующей:
 * - planned   — запланировано к покупке
 * - ordered   — заказано
 * - purchased — куплено
 * - delivered — доставлено / в руках
 */
const COMPONENT_CATEGORIES = [
  'cpu',
  'gpu',
  'motherboard',
  'ram',
  'storage',
  'psu',
  'case',
  'cooling',
  'peripherals',
  'other',
]

const useBuilderStore = create(
  persist(
    (set, get) => ({
      // Список сборок пользователя
      builds: [],
      activeBuildId: null,

      categoryLabels: {
        cpu: 'Процессор',
        gpu: 'Видеокарта',
        motherboard: 'Мат. плата',
        ram: 'Оперативная память',
        storage: 'Накопитель',
        psu: 'Блок питания',
        case: 'Корпус',
        cooling: 'Охлаждение',
        peripherals: 'Периферия',
        other: 'Другое',
      },

      categories: COMPONENT_CATEGORIES,

      // ---- Build CRUD ----
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
          activeBuildId: state.activeBuildId === buildId ? null : state.activeBuildId,
        }))
      },

      setActiveBuild: (buildId) => {
        set({ activeBuildId: buildId })
      },

      // ---- Component CRUD ----
      addComponent: (buildId, component) => {
        const newComponent = {
          id: crypto.randomUUID(),
          name: component.name,
          category: component.category,
          price: component.price || 0,
          status: 'planned',
          notes: component.notes || '',
          addedAt: new Date().toISOString(),
        }
        set((state) => ({
          builds: state.builds.map((b) =>
            b.id === buildId
              ? { ...b, components: [...b.components, newComponent], updatedAt: new Date().toISOString() }
              : b
          ),
        }))
      },

      removeComponent: (buildId, componentId) => {
        set((state) => ({
          builds: state.builds.map((b) =>
            b.id === buildId
              ? { ...b, components: b.components.filter((c) => c.id !== componentId), updatedAt: new Date().toISOString() }
              : b
          ),
        }))
      },

      updateComponentStatus: (buildId, componentId, status) => {
        set((state) => ({
          builds: state.builds.map((b) =>
            b.id === buildId
              ? {
                  ...b,
                  components: b.components.map((c) =>
                    c.id === componentId ? { ...c, status } : c
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
        }))
      },

      moveComponent: (buildId, fromIndex, toIndex) => {
        set((state) => ({
          builds: state.builds.map((b) => {
            if (b.id !== buildId) return b
            const components = [...b.components]
            const [moved] = components.splice(fromIndex, 1)
            components.splice(toIndex, 0, moved)
            return { ...b, components, updatedAt: new Date().toISOString() }
          }),
        }))
      },

      // ---- Computed Selectors ----
      getActiveBuild: () => {
        const state = get()
        return state.builds.find((b) => b.id === state.activeBuildId) || null
      },

      getTotalPrice: (buildId) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) return 0
        return build.components.reduce((sum, c) => sum + (c.price || 0), 0)
      },

      getProgress: (buildId) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build || build.components.length === 0) return 0
        const delivered = build.components.filter((c) => c.status === 'delivered').length
        return Math.round((delivered / build.components.length) * 100)
      },
    }),
    {
      name: 'neoforge-builder',
    }
  )
)

export default useBuilderStore
