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

export type ComponentStatus = 'planned' | 'ordered' | 'purchased' | 'delivered';

export interface Component {
  id: string;
  name: string;
  category: string;
  price: number;
  status: ComponentStatus;
  notes: string;
  attrs: Record<string, any>;
  addedAt: string;
}

export interface Build {
  id: string;
  name: string;
  components: Component[];
  createdAt: string;
  updatedAt: string;
}

interface BuilderState {
  builds: Build[];
  activeBuildId: string | null;
  _uid: string | null;
  _unsubscribe: (() => void) | null;
  categories: string[];
  categoryLabels: Record<string, string>;

  subscribeToBuilds: (uid: string | null) => void;
  unsubscribeFromBuilds: () => void;
  migrateLocalBuilds: (uid: string) => Promise<void>;

  createBuild: (name: string) => string;
  deleteBuild: (buildId: string) => void;
  renameBuild: (buildId: string, name: string) => void;
  setActiveBuild: (buildId: string | null) => void;

  _saveCurrent: (buildId: string) => void;
  addComponent: (buildId: string, component: any) => string;
  updateComponent: (buildId: string, componentId: string, updates: Partial<Component>) => void;
  removeComponent: (buildId: string, componentId: string) => void;
  setComponentStatus: (buildId: string, componentId: string, newStatus: ComponentStatus) => void;

  getActiveBuild: () => Build | null;
  getComponentsByCategory: (buildId: string, category: string) => Component[];
  getTotalPrice: (buildId: string) => number;
  getCategoryPrice: (buildId: string, category: string) => number;
  getProgress: (buildId: string) => number;
  getStatusCounts: (buildId: string) => Record<string, number>;
}

const COMPONENT_STATUSES: ComponentStatus[] = ['planned', 'ordered', 'purchased', 'delivered']

/** Вес статуса для прогресс-бара */
const STATUS_WEIGHT: Record<ComponentStatus, number> = {
  planned: 0,
  ordered: 0.25,
  purchased: 0.5,
  delivered: 1.0,
}

const CATEGORIES = Object.keys(CATEGORY_SCHEMAS)

async function saveBuildToFirestore(uid: string, build: Build) {
  if (!uid) return
  try {
    await setDoc(doc(db, 'users', uid, 'builds', build.id), build)
  } catch (e) {
    console.error('Firestore save error:', e)
  }
}

async function deleteBuildFromFirestore(uid: string, buildId: string) {
  if (!uid) return
  try {
    await deleteDoc(doc(db, 'users', uid, 'builds', buildId))
  } catch (e) {
    console.error('Firestore delete error:', e)
  }
}

const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      builds: [],
      activeBuildId: null,
      _uid: null,
      _unsubscribe: null,

      categories: CATEGORIES,

      categoryLabels: Object.fromEntries(
        CATEGORIES.map((key) => [key, (CATEGORY_SCHEMAS as any)[key].label])
      ),

      // ──── Firestore Sync ────

      subscribeToBuilds: (uid: string | null) => {
        const prev = get()._unsubscribe
        if (prev) prev()

        if (!uid) {
          set({ _uid: null, _unsubscribe: null })
          return
        }

        const ref = collection(db, 'users', uid, 'builds')
        
        // Подписываемся с includeMetadataChanges, чтобы ловить hasPendingWrites
        const unsubscribe = onSnapshot(ref, { includeMetadataChanges: true }, (snapshot) => {
          // Игнорируем локальные (оптимистичные) изменения чтобы UI не "моргал"
          if (snapshot.metadata.hasPendingWrites) return;

          const builds = snapshot.docs.map((d) => d.data() as Build)
          builds.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
          set({ builds })
        })

        set({ _uid: uid, _unsubscribe: unsubscribe })
      },

      unsubscribeFromBuilds: () => {
        const unsub = get()._unsubscribe
        if (unsub) unsub()
        set({ builds: [], activeBuildId: null, _uid: null, _unsubscribe: null })
      },

      migrateLocalBuilds: async (uid: string) => {
        const { builds } = get()
        if (builds.length === 0) return

        const ref = collection(db, 'users', uid, 'builds')
        const snapshot = await getDocs(ref)
        const cloudBuilds = snapshot.docs.map(d => d.data() as Build)
        const cloudNames = new Set(cloudBuilds.map(b => b.name))

        for (const localBuild of builds) {
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

        set({ builds: [], activeBuildId: null })
      },

      // ──── Build CRUD ────
      createBuild: (name: string) => {
        const uid = get()._uid
        const build: Build = {
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
        if (uid) saveBuildToFirestore(uid, build)
        return build.id
      },

      deleteBuild: (buildId: string) => {
        const uid = get()._uid
        set((state) => ({
          builds: state.builds.filter((b) => b.id !== buildId),
          activeBuildId:
            state.activeBuildId === buildId ? null : state.activeBuildId,
        }))
        if (uid) deleteBuildFromFirestore(uid, buildId)
      },

      renameBuild: (buildId: string, name: string) => {
        const uid = get()._uid
        set((state) => ({
          builds: state.builds.map((b) =>
            b.id === buildId ? { ...b, name, updatedAt: new Date().toISOString() } : b
          ),
        }))
        if (!uid) return;
        const build = get().builds.find((b) => b.id === buildId)
        if (build) saveBuildToFirestore(uid, build)
      },

      setActiveBuild: (buildId: string | null) => {
        set({ activeBuildId: buildId })
      },

      // ──── Component CRUD (+ auto-save) ────
      _saveCurrent: (buildId: string) => {
        const uid = get()._uid
        if (!uid) return;
        const build = get().builds.find((b) => b.id === buildId)
        if (build) saveBuildToFirestore(uid, build)
      },

      addComponent: (buildId: string, component: any) => {
        const newComponent: Component = {
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

      updateComponent: (buildId: string, componentId: string, updates: Partial<Component>) => {
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

      removeComponent: (buildId: string, componentId: string) => {
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

      setComponentStatus: (buildId: string, componentId: string, newStatus: ComponentStatus) => {
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

      getComponentsByCategory: (buildId: string, category: string) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) return []
        return build.components.filter((c) => c.category === category)
      },

      getTotalPrice: (buildId: string) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) return 0
        return build.components.reduce((sum, c) => sum + (c.price || 0), 0)
      },

      getCategoryPrice: (buildId: string, category: string) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) return 0
        return build.components
          .filter((c) => c.category === category)
          .reduce((sum, c) => sum + (c.price || 0), 0)
      },

      getProgress: (buildId: string) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build || build.components.length === 0) return 0
        const totalWeight = build.components.reduce(
          (sum, c) => sum + (STATUS_WEIGHT[c.status] || 0),
          0
        )
        return Math.round((totalWeight / build.components.length) * 100)
      },

      getStatusCounts: (buildId: string) => {
        const build = get().builds.find((b) => b.id === buildId)
        if (!build) return { planned: 0, ordered: 0, purchased: 0, delivered: 0 }
        const counts: Record<string, number> = { planned: 0, ordered: 0, purchased: 0, delivered: 0 }
        for (const c of build.components) {
          counts[c.status] = (counts[c.status] || 0) + 1
        }
        return counts
      },
    }),
    {
      name: 'neoforge-builder',
      // @ts-ignore Ignore type for partialize due to standard zustand persist typings issue
      partialize: (state) => ({
        builds: state.builds,
        activeBuildId: state.activeBuildId,
      }),
    }
  )
)

export default useBuilderStore
