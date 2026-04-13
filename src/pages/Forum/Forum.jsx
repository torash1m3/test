import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Heart, Plus, Newspaper, MessagesSquare, Send, Trash2 } from 'lucide-react'
import { Button, Card, Avatar, Input, Modal } from '@/shared/ui'
import useForumStore from '@/stores/forumStore'
import useAuthStore from '@/stores/authStore'
import styles from './Forum.module.css'

const TAB_ICONS = {
  news: Newspaper,
  chat: MessagesSquare,
}

export default function ForumPage() {
  const { sections, sectionLabels, posts, loading, subscribe, unsubscribe, createPost, deletePost, toggleLike, addComment, fetchComments, getPostsBySection } = useForumStore()
  const { user } = useAuthStore()
  const [activeSection, setActiveSection] = useState('news')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [submitting, setSubmitting] = useState(false)
  
  // Комментарии и раскрытые посты
  const [commentText, setCommentText] = useState({})
  const [expandedComments, setExpandedComments] = useState({}) // { postId: boolean }
  const [loadedComments, setLoadedComments] = useState({}) // { postId: [comments...] }
  const [loadingComments, setLoadingComments] = useState({}) // { postId: boolean }

  // Подписка на посты при маунте
  useEffect(() => {
    subscribe()
    return () => unsubscribe()
  }, [subscribe, unsubscribe])

  const sectionPosts = getPostsBySection(activeSection)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.content.trim() || !user) return
    setSubmitting(true)
    await createPost({
      section: activeSection,
      title: form.title.trim(),
      content: form.content.trim(),
      authorId: user.uid,
      authorName: user.displayName || user.email,
    })
    setForm({ title: '', content: '' })
    setShowCreate(false)
    setSubmitting(false)
  }

  const handleLike = async (postId) => {
    if (!user) return
    await toggleLike(postId, user.uid)
  }

  const handleDelete = async (postId) => {
    await deletePost(postId)
  }

  const handleExpandComments = async (postId) => {
    const isExpanded = expandedComments[postId]
    if (isExpanded) {
      setExpandedComments((p) => ({ ...p, [postId]: false }))
      return
    }

    setExpandedComments((p) => ({ ...p, [postId]: true }))
    
    // Подгружаем если еще нет
    if (!loadedComments[postId]) {
      setLoadingComments((p) => ({ ...p, [postId]: true }))
      const comments = await fetchComments(postId)
      setLoadedComments((p) => ({ ...p, [postId]: comments }))
      setLoadingComments((p) => ({ ...p, [postId]: false }))
    }
  }

  const handleAddComment = async (postId) => {
    const text = commentText[postId]?.trim()
    if (!text || !user) return
    
    // Оптимистично добавляем локально, если комменты уже загружены
    const newComment = {
      id: crypto.randomUUID(),
      content: text,
      authorName: user.displayName || user.email,
    }
    
    setLoadedComments((p) => ({
      ...p,
      [postId]: [...(p[postId] || []), newComment]
    }))
    setCommentText((prev) => ({ ...prev, [postId]: '' }))
    
    await addComment(postId, {
      content: text,
      authorId: user.uid,
      authorName: user.displayName || user.email,
    })
  }

  return (
    <motion.div
      className={styles.forum}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.forum__header}>
        <h1 className={styles.forum__title}>
          <span className="gradient-text">Форум</span>
        </h1>
        <p className={styles.forum__subtitle}>
          Обсуждай новости, делись опытом и общайся с комьюнити.
        </p>
        {user && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreate(true)}
            style={{ marginTop: 'var(--space-4)' }}
          >
            Написать
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.forum__tabs}>
        {sections.map((section) => {
          const Icon = TAB_ICONS[section]
          return (
            <button
              key={section}
              className={`${styles.forum__tab} ${activeSection === section ? styles['forum__tab--active'] : ''}`}
              onClick={() => setActiveSection(section)}
            >
              {Icon && <Icon size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />}
              {sectionLabels[section]}
            </button>
          )
        })}
      </div>

      {/* Posts */}
      <div className={styles.forum__posts}>
        {loading ? (
          <div className={styles.forum__empty}>
            <p style={{ color: 'var(--color-text-muted)' }}>Загрузка...</p>
          </div>
        ) : sectionPosts.length > 0 ? (
          sectionPosts.map((post) => {
            const hasLiked = user && post.likedBy?.includes(user.uid)
            const isCommentsExpanded = expandedComments[post.id]

            return (
              <Card key={post.id}>
                <div className={styles.post__meta}>
                  <Avatar name={post.authorName} size="sm" />
                  <span className={styles.post__author}>{post.authorName}</span>
                  <span className={styles.post__date}>
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString('ru-RU') : ''}
                  </span>
                  {user && user.uid === post.authorId && (
                    <button
                      className={styles.post__delete}
                      onClick={() => handleDelete(post.id)}
                      title="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {post.title && (
                  <h3 style={{ marginBottom: 'var(--space-2)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {post.title}
                  </h3>
                )}
                <p className={styles.post__content}>{post.content}</p>

                <Card.Footer>
                  <div className={styles.post__actions}>
                    <button 
                      className={styles.post__action} 
                      onClick={() => handleLike(post.id)}
                      style={{ color: hasLiked ? 'var(--color-error)' : undefined }}
                    >
                      <Heart size={14} fill={hasLiked ? 'currentColor' : 'none'} /> 
                      {post.likedBy?.length || 0}
                    </button>
                    <button className={styles.post__action} onClick={() => handleExpandComments(post.id)}>
                      <MessageSquare size={14} /> {post.commentCount || 0}
                    </button>
                  </div>
                </Card.Footer>

                {/* Подгруженные комментарии */}
                <AnimatePresence>
                  {isCommentsExpanded && (
                    <motion.div 
                      className={styles.post__comments}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {loadingComments[post.id] ? (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', padding: 'var(--space-2) 0' }}>
                          Загрузка комментариев...
                        </div>
                      ) : loadedComments[post.id]?.length > 0 ? (
                        loadedComments[post.id].map((c) => (
                          <div key={c.id} className={styles.comment}>
                            <span className={styles.comment__author}>{c.authorName}</span>
                            <span className={styles.comment__text}>{c.content}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', padding: 'var(--space-2) 0' }}>
                          Пока нет комментариев
                        </div>
                      )}

                      {user && (
                        <div className={styles.post__comment_form} style={{ marginTop: 'var(--space-2)' }}>
                          <input
                            className={styles.post__comment_input}
                            placeholder="Написать комментарий..."
                            value={commentText[post.id] || ''}
                            onChange={(e) =>
                              setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            maxLength={1000}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(post.id)
                            }}
                          />
                          <button
                            className={styles.post__comment_send}
                            onClick={() => handleAddComment(post.id)}
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )
          })
        ) : (
          <div className={styles.forum__empty}>
            <MessageSquare size={40} style={{ marginInline: 'auto', marginBottom: 'var(--space-4)', opacity: 0.4 }} />
            <h3 className={styles['forum__empty-title']}>Пока здесь пусто</h3>
            <p>Стань первым, кто напишет {sectionLabels[activeSection].toLowerCase() === 'новости' ? 'новость' : 'сообщение'}!</p>
            {user && (
              <Button variant="primary" icon={Plus} style={{ marginTop: 'var(--space-4)' }} onClick={() => setShowCreate(true)}>
                Написать
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={`Новый пост — ${sectionLabels[activeSection]}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!form.content.trim() || submitting}
            >
              {submitting ? 'Публикация...' : 'Опубликовать'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="Заголовок (необязательно)"
            placeholder="Тема поста"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            maxLength={100}
          />
          <Input
            label="Текст"
            textarea
            placeholder="Расскажи что-нибудь..."
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            required
            maxLength={5000}
            style={{ minHeight: '100px' }}
          />
        </form>
      </Modal>
    </motion.div>
  )
}
