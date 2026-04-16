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
  User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import useBuilderStore from './builderStore'

const googleProvider = new GoogleAuthProvider()
const ALLOWED_ROLES = ['user', 'moderator', 'admin'] as const;
export type Role = typeof ALLOWED_ROLES[number];

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  nickname: string;
  avatarUrl: string;
  pcSpecs: string;
  bio: string;
  socialLinks: { telegram: string; vk: string };
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfile extends Omit<UserProfile, 'email'> {}

interface AuthState {
  user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;

  init: () => void;
  fetchProfile: (uid: string) => Promise<UserProfile | null>;
  fetchPublicProfile: (uid: string) => Promise<PublicProfile | null>;
  syncPublicProfile: (profile: Partial<UserProfile>) => Promise<void>;
  saveProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  updateUserRole: (targetUid: string, newRole: Role) => Promise<boolean>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

function buildPrivateProfile(firebaseUser: FirebaseUser, overrides: Partial<UserProfile> = {}): UserProfile {
  const displayName = overrides.displayName ?? firebaseUser.displayName ?? ''
  const avatarUrl = overrides.avatarUrl ?? firebaseUser.photoURL ?? ''
  const now = new Date().toISOString()

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
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

function toPublicProfile(profile: UserProfile | Partial<UserProfile>): PublicProfile {
  return {
    uid: profile.uid || '',
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

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

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

        const builder = useBuilderStore.getState()
        builder.subscribeToBuilds(firebaseUser.uid)
        await builder.migrateLocalBuilds(firebaseUser.uid)
      } else {
        set({ user: null, profile: null, loading: false, error: null })
        useBuilderStore.getState().unsubscribeFromBuilds()
      }
    })
  },

  fetchProfile: async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists()) {
        return snap.data() as UserProfile
      }
      return null
    } catch {
      return null
    }
  },

  fetchPublicProfile: async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'publicProfiles', uid))
      if (snap.exists()) {
        return snap.data() as PublicProfile
      }
      return null
    } catch {
      return null
    }
  },

  syncPublicProfile: async (profile: Partial<UserProfile>) => {
    if (!profile?.uid) return
    await setDoc(doc(db, 'publicProfiles', profile.uid), toPublicProfile(profile), { merge: true })
  },

  saveProfile: async (profileData: Partial<UserProfile>) => {
    const { user } = get()
    if (!user) return

    const currentProfile = get().profile || {} as UserProfile
    const data: UserProfile = {
      ...currentProfile,
      ...profileData,
      uid: user.uid,
      email: user.email || '',
      role: currentProfile.role || 'user',
      createdAt: currentProfile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const batch = writeBatch(db)
    batch.set(doc(db, 'users', user.uid), data, { merge: true })
    batch.set(doc(db, 'publicProfiles', user.uid), toPublicProfile(data), { merge: true })
    await batch.commit()
    set({ profile: { ...get().profile, ...data } as UserProfile })
  },

  updateUserRole: async (targetUid: string, newRole: Role) => {
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

  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null })
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      await updateProfile(firebaseUser, { displayName })

      const privateProfile = buildPrivateProfile(firebaseUser, {
        displayName,
        nickname: displayName,
        avatarUrl: '',
      })
      await setDoc(doc(db, 'users', firebaseUser.uid), privateProfile)
      await setDoc(doc(db, 'publicProfiles', firebaseUser.uid), toPublicProfile(privateProfile))

      return { success: true }
    } catch (error: any) {
      const message = getErrorMessage(error.code)
      set({ error: message, loading: false })
      return { success: false, error: message }
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null })
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error: any) {
      const message = getErrorMessage(error.code)
      set({ error: message, loading: false })
      return { success: false, error: message }
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null })
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user

      const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (!snap.exists()) {
        const privateProfile = buildPrivateProfile(firebaseUser)
        await setDoc(doc(db, 'users', firebaseUser.uid), privateProfile)
        await setDoc(doc(db, 'publicProfiles', firebaseUser.uid), toPublicProfile(privateProfile))
      } else {
        await get().syncPublicProfile(snap.data() as UserProfile)
      }

      return { success: true }
    } catch (error: any) {
      const message = getErrorMessage(error.code)
      set({ error: message, loading: false })
      return { success: false, error: message }
    }
  },

  signOut: async () => {
    useBuilderStore.getState().unsubscribeFromBuilds()
    await firebaseSignOut(auth)
    set({ user: null, profile: null })
  },

  clearError: () => set({ error: null }),
}))

function getErrorMessage(code: string): string {
  const map: Record<string, string> = {
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
