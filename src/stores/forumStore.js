/**
 * NeoForge — Forum Store (Firestore)
 *
 * Посты и комментарии в Firestore с real-time обновлениями.
 */
import { create } from 'zustand'
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDocs,
  increment,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

const FORUM_REF = collection(db, 'forum')

const useForumStore = create((set, get) => ({
  sections: ['news', 'chat'],

  sectionLabels: {
    news: 'Новости',
    chat: 'Чат',
  },

  posts: [],
  loading: true,
  _unsubscribe: null,

  /**
   * Подписаться на посты (real-time)
   */
  subscribe: () => {
    const prev = get()._unsubscribe
    if (prev) prev()

    const q = query(FORUM_REF, orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() || d.data().createdAt,
      }))
      set({ posts, loading: false })
    })

    set({ _unsubscribe: unsubscribe })
  },

  unsubscribe: () => {
    const unsub = get()._unsubscribe
    if (unsub) unsub()
    set({ _unsubscribe: null })
  },

  // ── CRUD ──

  createPost: async ({ section, title, content, authorId, authorName }) => {
    await addDoc(FORUM_REF, {
      section: section || 'chat',
      title: (title || '').trim(),
      content: content.trim(),
      authorId,
      authorName: authorName.trim(),
      commentCount: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
    })
  },

  deletePost: async (postId) => {
    // В Firestore нет каскадного удаления без Cloud Functions,
    // но для MVP достаточно удалить сам пост. Комменты останутся "орфанами" в БД,
    // но они больше нигде не загрузятся. Будем считать это достаточным.
    await deleteDoc(doc(db, 'forum', postId))
  },

  addComment: async (postId, { content, authorId, authorName }) => {
    // Пишем в подколлекцию
    const commentsRef = collection(db, 'forum', postId, 'comments')
    await addDoc(commentsRef, {
      content: content.trim(),
      authorId,
      authorName: authorName.trim(),
      createdAt: serverTimestamp()
    })
    // Увеличиваем счетчик в самом посте
    await updateDoc(doc(db, 'forum', postId), {
      commentCount: increment(1)
    })
  },

  fetchComments: async (postId) => {
    const q = query(collection(db, 'forum', postId, 'comments'), orderBy('createdAt', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString?.() || d.data().createdAt,
    }))
  },

  toggleLike: async (postId, uid) => {
    // Находим пост, чтобы понять добавить лайк или удалить
    const post = get().posts.find(p => p.id === postId)
    if (!post) return

    const hasLiked = post.likedBy?.includes(uid)
    await updateDoc(doc(db, 'forum', postId), {
      likedBy: hasLiked ? arrayRemove(uid) : arrayUnion(uid)
    })
  },

  // ── Selectors ──
  getPostsBySection: (section) => {
    return get().posts.filter((p) => p.section === section)
  },
}))

export default useForumStore
