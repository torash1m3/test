import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Heart, Plus, Newspaper, MessagesSquare } from 'lucide-react'
import { Button, Card, Avatar } from '@/shared/ui'
import useForumStore from '@/stores/forumStore'
import styles from './Forum.module.css'

const TAB_ICONS = {
  news: Newspaper,
  chat: MessagesSquare,
}

export default function ForumPage() {
  const { sections, sectionLabels, posts, getPostsBySection } = useForumStore()
  const [activeSection, setActiveSection] = useState('news')

  const sectionPosts = getPostsBySection(activeSection)

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
        {sectionPosts.length > 0 ? (
          sectionPosts.map((post) => (
            <Card key={post.id} interactive>
              <div className={styles.post__meta}>
                <Avatar name={post.authorName} size="sm" />
                <span className={styles.post__author}>{post.authorName}</span>
                <span className={styles.post__date}>
                  {new Date(post.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              {post.title && (
                <h3 style={{ marginBottom: 'var(--space-2)', fontWeight: 'var(--font-weight-semibold)' }}>
                  {post.title}
                </h3>
              )}
              <p className={styles.post__content}>{post.content}</p>
              <Card.Footer>
                <div className={styles.post__actions}>
                  <button className={styles.post__action}>
                    <Heart size={14} /> {post.likes}
                  </button>
                  <button className={styles.post__action}>
                    <MessageSquare size={14} /> {post.comments.length}
                  </button>
                </div>
              </Card.Footer>
            </Card>
          ))
        ) : (
          <div className={styles.forum__empty}>
            <MessageSquare size={40} style={{ marginInline: 'auto', marginBottom: 'var(--space-4)', opacity: 0.4 }} />
            <h3 className={styles['forum__empty-title']}>Пока здесь пусто</h3>
            <p>Стань первым, кто напишет {sectionLabels[activeSection].toLowerCase() === 'новости' ? 'новость' : 'сообщение'}!</p>
            <Button variant="primary" icon={Plus} style={{ marginTop: 'var(--space-4)' }}>
              Написать
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
