import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router'
import { Newspaper, MessagesSquare, Send, Trash2, Heart, MessageSquare, Reply } from 'lucide-react'
import useForumStore from '@/stores/forumStore'
import useAuthStore from '@/stores/authStore'
import styles from './Forum.module.css'

const CHANNELS = [
  { id: 'chat', label: 'Global Chat', icon: MessagesSquare },
  { id: 'news', label: 'News', icon: Newspaper },
]

export default function ForumPage() {
  const { posts, loading, subscribe, unsubscribe, createPost, deletePost, toggleLike, addComment, fetchComments } = useForumStore()
  const { user, profile } = useAuthStore()
  
  const [activeChannel, setActiveChannel] = useState('chat')
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Комментарии (Threads)
  const [expandedThreads, setExpandedThreads] = useState({}) // { messageId: boolean }
  const [loadedComments, setLoadedComments] = useState({}) // { messageId: [comments...] }
  const [loadingComments, setLoadingComments] = useState({}) // { messageId: boolean }
  const [threadInputs, setThreadInputs] = useState({}) // { messageId: text }

  const messagesEndRef = useRef(null)
  
  // Авто-прокрутка вниз при изменении списка постов или смене канала
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    subscribe()
    return () => unsubscribe()
  }, [subscribe, unsubscribe])

  const channelMessages = posts.filter(p => p.section === activeChannel).reverse() // Firestore возвращает свежие первыми (desc), нам для чата нужно asc (свежие снизу)

  useEffect(() => {
    // Ждём рендера и скроллим вниз
    setTimeout(scrollToBottom, 100)
  }, [channelMessages.length, activeChannel])


  // --- ACTIONS ---

  const handleSendMessage = async (e) => {
    e?.preventDefault?.()
    if (!inputValue.trim() || !user) return
    setSubmitting(true)
    try {
      await createPost({
        section: activeChannel,
        title: '', // для чата тайтлы не нужны
        content: inputValue.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email,
      })
      setInputValue('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleDelete = async (postId) => {
    if (confirm('Удалить сообщение?')) {
      await deletePost(postId)
    }
  }

  const handleLike = async (postId) => {
    if (!user) return
    await toggleLike(postId, user.uid)
  }

  // --- THREADS (COMMENTS) ---

  const toggleThread = async (postId) => {
    const isExpanded = expandedThreads[postId]
    if (isExpanded) {
      setExpandedThreads(p => ({ ...p, [postId]: false }))
      return
    }

    setExpandedThreads(p => ({ ...p, [postId]: true }))
    
    if (!loadedComments[postId]) {
      setLoadingComments(p => ({ ...p, [postId]: true }))
      try {
        const comments = await fetchComments(postId)
        setLoadedComments(p => ({ ...p, [postId]: comments }))
      } catch {
        setExpandedThreads(p => ({ ...p, [postId]: false }))
      } finally {
        setLoadingComments(p => ({ ...p, [postId]: false }))
      }
    }
  }

  const handleSendThreadMsg = async (postId) => {
    const text = threadInputs[postId]?.trim()
    if (!text || !user) return
    
    const newComment = {
      id: crypto.randomUUID(),
      content: text,
      authorName: user.displayName || user.email,
    }
    const prevs = loadedComments[postId] || []

    setLoadedComments(p => ({ ...p, [postId]: [...prevs, newComment] }))
    setThreadInputs(p => ({ ...p, [postId]: '' }))

    try {
      await addComment(postId, {
        content: text,
        authorId: user.uid,
        authorName: user.displayName || user.email,
      })
    } catch {
      setLoadedComments(p => ({ ...p, [postId]: prevs }))
      setThreadInputs(p => ({ ...p, [postId]: text }))
    }
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <motion.div 
      className={styles.chatLayout}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* SIDEBAR (Каналы) */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>NeoChat</div>
          <div className={styles.sidebarSubtitle}>Stay connected</div>
        </div>
        <div className={styles.channelList}>
          {CHANNELS.map(ch => (
            <button
              key={ch.id}
              className={`${styles.channelBtn} ${activeChannel === ch.id ? styles.channelBtnActive : ''}`}
              onClick={() => setActiveChannel(ch.id)}
            >
              <ch.icon size={18} />
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className={styles.mainArea}>
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderTitle}>
            {CHANNELS.find(c => c.id === activeChannel)?.label}
          </div>
        </div>

        <div className={styles.messagesContainer}>
          {loading ? (
            <div className={styles.messagesEmpty}>
              Загрузка...
            </div>
          ) : channelMessages.length > 0 ? (
            channelMessages.map(msg => {
              const isMine = user?.uid === msg.authorId
              const hasLiked = user && msg.likedBy?.includes(user?.uid)
              const canDelete = isMine || isAdmin
              const isThreadOpen = expandedThreads[msg.id]

              return (
                <div 
                  key={msg.id} 
                  className={`${styles.messageWrapper} ${isMine ? styles.messageMine : styles.messageTheirs}`}
                >
                  <div className={styles.messageMeta}>
                    <Link to={`/profile/${msg.authorId}`} className={styles.messageAuthorLink} style={{ color: 'inherit', textDecoration: 'none' }}>
                      <span className={styles.messageAuthor}>{msg.authorName}</span>
                    </Link>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
                  </div>
                  
                  <div className={styles.messageBubble}>
                    {msg.title && <div className={styles.messageTitle}>{msg.title}</div>}
                    <div className={styles.messageContent}>{msg.content}</div>

                    <div className={styles.messageActions}>
                      <button 
                        className={`${styles.actionBtn} ${hasLiked ? styles.actionBtnLiked : ''}`}
                        onClick={() => handleLike(msg.id)}
                      >
                        <Heart size={12} fill={hasLiked ? 'currentColor' : 'none'} />
                        {msg.likedBy?.length > 0 && msg.likedBy.length}
                      </button>
                      
                      <button 
                        className={styles.actionBtn}
                        onClick={() => toggleThread(msg.id)}
                      >
                        <MessageSquare size={12} />
                        {msg.commentCount > 0 && msg.commentCount}
                      </button>

                      {canDelete && (
                        <button 
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          onClick={() => handleDelete(msg.id)}
                          title={isAdmin && !isMine ? "Удалить как Admin" : "Удалить"}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    {/* Тред (комменты) */}
                    <AnimatePresence>
                      {isThreadOpen && (
                        <motion.div 
                          className={styles.threadContainer}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {loadingComments[msg.id] ? (
                            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Грузим ветку...</span>
                          ) : loadedComments[msg.id]?.map(c => (
                            <div key={c.id} className={styles.threadItem}>
                              <Link to={`/profile/${c.authorId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                <span className={styles.threadAuthor}>{c.authorName}:</span>
                              </Link>
                              <span className={styles.threadContent}>{c.content}</span>
                            </div>
                          ))}
                          
                          {user && (
                            <div className={styles.threadInputRow}>
                              <input 
                                className={styles.threadInput}
                                placeholder="Ответить в ветку..."
                                value={threadInputs[msg.id] || ''}
                                onChange={e => setThreadInputs(p => ({ ...p, [msg.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleSendThreadMsg(msg.id)}
                              />
                              <button className={styles.threadSendBtn} onClick={() => handleSendThreadMsg(msg.id)}>
                                <Reply size={12} />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })
          ) : (
            <div className={styles.messagesEmpty}>
              Здесь пока ничего нет. Напиши первым!
            </div>
          )}
          {/* Пустой div для авто-скролла */}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        {user ? (
          <div className={styles.chatInputArea}>
            <textarea
              className={styles.chatTextarea}
              placeholder="Написать сообщение..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button 
              className={styles.chatSendBtn}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || submitting}
            >
              <Send size={18} />
            </button>
          </div>
        ) : (
          <div className={styles.chatInputArea} style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              Войди в аккаунт, чтобы писать сообщения
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
