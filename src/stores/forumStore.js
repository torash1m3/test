import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useForumStore = create(
  persist(
    (set, get) => ({
      // Разделы
      sections: ['news', 'chat'],

      sectionLabels: {
        news: 'Новости',
        chat: 'Чат',
      },

      // Посты
      posts: [],

      // ---- Posts CRUD ----
      createPost: (post) => {
        const newPost = {
          id: crypto.randomUUID(),
          section: post.section || 'chat',
          title: post.title || '',
          content: post.content,
          authorId: post.authorId,
          authorName: post.authorName,
          comments: [],
          likes: 0,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          posts: [newPost, ...state.posts],
        }))
        return newPost.id
      },

      deletePost: (postId) => {
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId),
        }))
      },

      addComment: (postId, comment) => {
        const newComment = {
          id: crypto.randomUUID(),
          content: comment.content,
          authorId: comment.authorId,
          authorName: comment.authorName,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? { ...p, comments: [...p.comments, newComment] }
              : p
          ),
        }))
      },

      likePost: (postId) => {
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, likes: p.likes + 1 } : p
          ),
        }))
      },

      // ---- Selectors ----
      getPostsBySection: (section) => {
        return get().posts.filter((p) => p.section === section)
      },
    }),
    {
      name: 'neoforge-forum',
    }
  )
)

export default useForumStore
