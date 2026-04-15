/**
 * NeoForge — Auth Store (Firebase)
 *
 * Реальная авторизация через Firebase Auth.
 * Поддерживает Email/Password и Google Sign-In.
 */
import { create } from 'zustand'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import useBuilderStore from './builderStore'

const googleProvider = new GoogleAuthProvider()
const ALLOWED_ROLES = ['user', 'moderator', 'admin']

function buildPrivateProfile(firebaseUser, overrides = {}) {
  const displayName = overrides.displayName ?? firebaseUser.displayName ?? ''
  const avatarUrl = overrides.avatarUrl ?? firebaseUser.photoURL ?? ''
  const now = new Date().toISOString()

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName,
    nickname: overrides.nickname ?? displayName,
    avatarUrl,
    pcSpecs: overrides.pcSpecs ?? '',
    bio: overrides.bio ?? '',
    socialLinks: overrides.socialLinks ?? { telegram: '', vk: '' },
    role: overrides.role ?? 'user',
    createdAt: overrides.createdAt ?? now,
    updatedAt: now,
  }
}

function toPublicProfile(profile) {
  return {
    uid: profile.uid,
    displayName: profile.displayName || '',
    nickname: profile.nickname || profile.displayName || '',
    avatarUrl: profile.avatarUrl || '',
    pcSpecs: profile.pcSpecs || '',
    bio: profile.bio || '',
    socialLinks: profile.socialLinks || { telegram: '', vk: '' },
    role: profile.role || 'user',
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: profile.updatedAt || new Date().toISOString(),
  }
}

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  /**
   * Инициализация — слушатель состояния авторизации.
   * Вызывается один раз при старте приложения.
   */
  init: () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await get().fetchProfile(firebaseUser.uid)
        if (profile) {
          await get().syncPublicProfile(profile)
        }

        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          },
          profile,
          loading: false,
          error: null,
        })

        // Синхронизация сборок с Firestore
        // Сначала подписка — snapshot подхватит данные после миграции автоматически
        const builder = useBuilderStore.getState()
        builder.subscribeToBuilds(firebaseUser.uid)
        await builder.migrateLocalBuilds(firebaseUser.uid)
      } else {
        set({ user: null, profile: null, loading: false, error: null })
        useBuilderStore.getState().unsubscribeFromBuilds()
      }
    })
  },

  /**
   * Загрузить профиль из Firestore
   */
  fetchProfile: async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists()) {
        return snap.data()
      }
      return null
    } catch {
      return null
    }
  },

  /**
   * Загрузить публичный профиль без приватных полей.
   */
  fetchPublicProfile: async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'publicProfiles', uid))
      if (snap.exists()) {
        return snap.data()
      }
      return null
    } catch {
      return null
    }
  },

  /**
   * Синхронизировать безопасную публичную карточку профиля.
   */
  syncPublicProfile: async (profile) => {
    if (!profile?.uid) return
    await setDoc(doc(db, 'publicProfiles', profile.uid), toPublicProfile(profile), { merge: true })
  },

  /**
   * Создать/обновить профиль в Firestore
   */
  saveProfile: async (profileData) => {
    const { user } = get()
    if (!user) return

    const currentProfile = get().profile || {}
    const data = {
      ...currentProfile,
      ...profileData,
      uid: user.uid,
      email: user.email,
      role: currentProfile.role || 'user',
      createdAt: currentProfile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const batch = writeBatch(db)
    batch.set(doc(db, 'users', user.uid), data, { merge: true })
    batch.set(doc(db, 'publicProfiles', user.uid), toPublicProfile(data), { merge: true })
    await batch.commit()
    set({ profile: { ...get().profile, ...data } })
  },

  /**
   * Обновить роль пользователя (только для админов)
   */
  updateUserRole: async (targetUid, newRole) => {
    if (!ALLOWED_ROLES.includes(newRole)) return false
    try {
      const batch = writeBatch(db)
      batch.set(doc(db, 'users', targetUid), { role: newRole }, { merge: true })
      const publicProfile = await getDoc(doc(db, 'publicProfiles', targetUid))
      if (publicProfile.exists()) {
        batch.set(doc(db, 'publicProfiles', targetUid), { role: newRole }, { merge: true })
      }
      await batch.commit()
      return true
    } catch (e) {
      console.error('Ошибка обновления роли:', e)
      return false
    }
  },

  /**
   * Регистрация по Email/Password
   */
  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null })
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      // Установить displayName
      await updateProfile(firebaseUser, { displayName })

      const privateProfile = buildPrivateProfile(firebaseUser, {
        displayName,
        nickname: displayName,
        avatarUrl: '',
      })
      await setDoc(doc(db, 'users', firebaseUser.uid), privateProfile)
      await setDoc(doc(db, 'publicProfiles', firebaseUser.uid), toPublicProfile(privateProfile))

      return { success: true }
    } catch (error) {
      const message = getErrorMessage(error.code)
      set({ error: message, loading: false })
      return { success: false, error: message }
    }
  },

  /**
   * Вход по Email/Password
   */
  signIn: async (email, password) => {
    set({ loading: true, error: null })
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error) {
      const message = getErrorMessage(error.code)
      set({ error: message, loading: false })
      return { success: false, error: message }
    }
  },

  /**
   * Вход через Google
   */
  signInWithGoogle: async () => {
    set({ loading: true, error: null })
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user

      // Создать профиль в Firestore если не существует
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (!snap.exists()) {
        const privateProfile = buildPrivateProfile(firebaseUser)
        await setDoc(doc(db, 'users', firebaseUser.uid), privateProfile)
        await setDoc(doc(db, 'publicProfiles', firebaseUser.uid), toPublicProfile(privateProfile))
      } else {
        await get().syncPublicProfile(snap.data())
      }

      return { success: true }
    } catch (error) {
      const message = getErrorMessage(error.code)
      set({ error: message, loading: false })
      return { success: false, error: message }
    }
  },

  /**
   * Выход
   */
  signOut: async () => {
    useBuilderStore.getState().unsubscribeFromBuilds()
    await firebaseSignOut(auth)
    set({ user: null, profile: null })
  },

  clearError: () => set({ error: null }),
}))

/**
 * Человекочитаемые ошибки
 */
function getErrorMessage(code) {
  const map = {
    'auth/email-already-in-use': 'Этот email уже зарегистрирован',
    'auth/invalid-email': 'Некорректный email',
    'auth/weak-password': 'Пароль слишком слабый (мин. 6 символов)',
    'auth/user-not-found': 'Пользователь не найден',
    'auth/wrong-password': 'Неверный пароль',
    'auth/invalid-credential': 'Неверный email или пароль',
    'auth/too-many-requests': 'Слишком много попыток. Подожди',
    'auth/popup-closed-by-user': 'Окно авторизации закрыто',
    'auth/network-request-failed': 'Ошибка сети',
  }
  return map[code] || `Ошибка авторизации (${code})`
}

export default useAuthStore
