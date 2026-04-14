/**
 * NeoForge — Builder Store (Firestore-synced)
 *
 * Сборки синхронизируются с Firestore когда пользователь залогинен.
 * Для неавторизованных — fallback в localStorage.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CATEGORY_SCHEMAS } from '@/features/builder/schemas'

const COMPONENT_STATUSES = ['planned', 'ordered', 'purchased', 'delivered']

/** Вес статуса для прогресс-бара */
const STATUS_WEIGHT = {
  planned: 0,
  ordered: 0.25,
  purchased: 0.5,
  delivered: 1.0,
}

const CATEGORIES = Object.keys(CATEGORY_SCHEMAS)

/**
 * Сохранить сборку в Firestore
 */
async function saveBuildToFirestore(uid, build) {
  if (!uid) return
  try {
    await setDoc(doc(db, 'users', uid, 'builds', build.id), build)
  } catch (e) {
    console.error('Firestore save error:', e)
  }
}

/**
 * Удалить сборку из Firestore
 */
async function deleteBuildFromFirestore(uid, buildId) {
  if (!uid) return
  try {
    await deleteDoc(doc(db, 'users', uid, 'builds', buildId))
  } catch (e) {
    console.error('Firestore delete error:', e)
  }
}

const useBuilderStore = create(
  persist(
    (set, get) => ({
      builds: [],
      activeBuildId: null,
      _uid: null,
      _unsubscribe: null,

      categories: CATEGORIES,

      categoryLabels: Object.fromEntries(
        CATEGORIES.map((key) => [key, CATEGORY_SCHEMAS[key].label])
      ),

      // ──── Firestore Sync ────

      /**
       * Подписаться на сборки пользователя в Firestore.
       * Вызывается из authStore при логине.
       */
      subscribeToBuilds: (uid) => {
        // Отписаться от предыдущего
        const prev = get()._unsubscribe
        if (prev) prev()

        if (!uid) {
          set({ _uid: null, _unsubscribe: null })
          return
        }

        const ref = collection(db, 'users', uid, 'builds')
        const unsubscribe = onSnapshot(ref, (snapshot) => {
          const builds = snapshot.docs.map((d) => d.data())
          // Сортировка по дате создания
          builds.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
          set({ builds })
        })

        set({ _uid: uid, _unsubscribe: unsubscribe })
      },

      /**
       * Отписаться (при логауте)
       */
      unsubscribeFromBuilds: () => {
        const unsub = get()._unsubscribe
        if (unsub) unsub()
        set({ builds: [], activeBuildId: null, _uid: null, _unsubscribe: null })
      },

      /**
       * Мигрировать локальные сборки в Firestore (с умным слиянием)
       */
      migrateLocalBuilds: async (uid) => {
        const { builds } = get()
        if (builds.length === 0) return

        // Загрузить облачные сборки
        const ref = collection(db, 'users', uid, 'builds')
        const snapshot = await getDocs(ref)
        const cloudBuilds = snapshot.docs.map(d => d.data())
        const cloudNames = new Set(cloudBuilds.map(b => b.name))

        // Мигрировать
        for (const localBuild of builds) {
          // Если сборка с таким ID уже есть в облаке — пропускаем (уже смигрирована)
          if (cloudBuilds.some(cb => cb.id === localBuild.id)) continue

          let newName = localBuild.name
          let counter = 1
          while (cloudNames.has(newName)) {
            newName = `${localBuild.name}_${counter}`
            counter++
          }

          const buildToSave = { ...localBuild, name: newName }
          await saveBuildToFirestore(uid, buildToSave)
          cloudNames.add(newName)
        }

        // Очистить локальные сборки после успешной миграции,
        // чтобы они не висели мертвым грузом в localStorage (они теперь в облаке).
        set({ builds: [], activeBuildId: null })
      },

      // ──── Build CRUD ────
      createBuild: (name) => {
        const uid = get()._uid
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
        saveBuildToFirestore(uid, build)
        return build.id
      },

      deleteBuild: (buildId) => {
        const uid = get()._uid
        set((state) => ({
          builds: state.builds.filter((b) => b.id !== buildId),
          activeBuildId:
            state.activeBuildId === buildId ? null : state.activeBuildId,
        }))
        deleteBuildFromFirestore(uid, buildId)
      },

      renameBuild: (buildId, name) => {
        const uid = get()._uid
        set((state) => ({
          builds: state.builds.map((b) =>
            b.id === buildId ? { ...b, name, updatedAt: new Date().toISOString() } : b
          ),
        }))
        const build = get().builds.find((b) => b.id === buildId)
        if (build) saveBuildToFirestore(uid, build)
      },

      setActiveBuild: (buildId) => {
        set({ activeBuildId: buildId })
      },

      // ──── Component CRUD (+ auto-save) ────
      _saveCurrent: (buildId) => {
        const uid = get()._uid
        const build = get().builds.find((b) => b.id === buildId)
        if (build) saveBuildToFirestore(uid, build)
      },

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
        get()._saveCurrent(buildId)
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
        get()._saveCurrent(buildId)
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
        get()._saveCurrent(buildId)
      },

      /**
       * Установить конкретный статус компонента (вместо цикличного переключения)
       */
      setComponentStatus: (buildId, componentId, newStatus) => {
        if (!COMPONENT_STATUSES.includes(newStatus)) return
        set((state) => ({
          builds: state.builds.map((b) => {
            if (b.id !== buildId) return b
            return {
              ...b,
              components: b.components.map((c) => {
                if (c.id !== componentId) return c
                return { ...c, status: newStatus }
              }),
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
        get()._saveCurrent(buildId)
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

      /**
       * Прогресс сборки — взвешенный по статусам.
       * planned=0%, ordered=25%, purchased=50%, delivered=100%
       */
      getProgress: (buildId) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build || build.components.length === 0) return 0
        const totalWeight = build.components.reduce(
          (sum, c) => sum + (STATUS_WEIGHT[c.status] || 0),
          0
        )
        return Math.round((totalWeight / build.components.length) * 100)
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
      // Не сохраняем служебные поля в localStorage
      partialize: (state) => ({
        builds: state.builds,
        activeBuildId: state.activeBuildId,
      }),
    }
  )
)

export default useBuilderStore
