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
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import useBuilderStore from './builderStore'

const googleProvider = new GoogleAuthProvider()

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
   * Создать/обновить профиль в Firestore
   */
  saveProfile: async (profileData) => {
    const { user } = get()
    if (!user) return

    const data = {
      ...profileData,
      uid: user.uid,
      email: user.email,
      updatedAt: new Date().toISOString(),
    }

    await setDoc(doc(db, 'users', user.uid), data, { merge: true })
    set({ profile: { ...get().profile, ...data } })
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

      // Создать профиль в Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName,
        nickname: displayName,
        avatarUrl: '',
        pcSpecs: '',
        bio: '',
        socialLinks: { telegram: '', vk: '' },
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

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
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || '',
          nickname: firebaseUser.displayName || '',
          avatarUrl: firebaseUser.photoURL || '',
          pcSpecs: '',
          bio: '',
          socialLinks: { telegram: '', vk: '' },
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
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
