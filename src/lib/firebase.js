/**
 * NeoForge — Firebase инициализация
 *
 * Единая точка входа для всех Firebase-сервисов.
 * Импортируй отсюда auth, db и т.д.
 */
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBCmAGANJho5bJ_FqOtyog2dojNZbjOvSQ',
  authDomain: 'neoforge-38813.firebaseapp.com',
  projectId: 'neoforge-38813',
  storageBucket: 'neoforge-38813.firebasestorage.app',
  messagingSenderId: '537628188345',
  appId: '1:537628188345:web:234639c7651c257cde4568',
  measurementId: 'G-PXEK7W3HVS',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
