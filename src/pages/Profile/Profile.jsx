import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Monitor, Settings, LogOut } from 'lucide-react'
import { Button, Card, Avatar } from '@/shared/ui'
import useAuthStore from '@/stores/authStore'
import styles from './Profile.module.css'

export default function ProfilePage() {
  const { user, profile, loading, signOut } = useAuthStore()
  const isAuthenticated = !!user

  if (loading) {
    return (
      <motion.div
        className={styles.profile}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className={styles.profile__guest}>
          <p style={{ color: 'var(--color-text-muted)' }}>Загрузка...</p>
        </div>
      </motion.div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <motion.div
        className={styles.profile}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className={styles.profile__guest}>
          <h2 className={styles['profile__guest-title']}>Не авторизован</h2>
          <p className={styles['profile__guest-desc']}>
            Войди в аккаунт, чтобы увидеть свой профиль
          </p>
          <Link to="/auth">
            <Button variant="primary">Войти</Button>
          </Link>
        </div>
      </motion.div>
    )
  }

  const displayName = user.displayName || profile?.nickname || user.email

  return (
    <motion.div
      className={styles.profile}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card flush>
        <div className={styles.profile__hero}>
          <Avatar
            src={user.photoURL}
            name={displayName}
            size="xl"
            ring
          />
          <h1 className={styles.profile__name}>{displayName}</h1>
          <p className={styles.profile__email}>{user.email}</p>
          {profile?.createdAt && (
            <p className={styles.profile__joined}>
              На платформе с {new Date(profile.createdAt).toLocaleDateString('ru-RU')}
            </p>
          )}
          <div className={styles.profile__actions}>
            <Button variant="secondary" size="sm" icon={Settings}>
              Настройки
            </Button>
            <Button variant="ghost" size="sm" icon={LogOut} onClick={signOut}>
              Выйти
            </Button>
          </div>
        </div>
      </Card>

      {/* PC Specs */}
      <div className={styles.profile__section}>
        <h2 className={styles['profile__section-title']}>
          <Monitor size={20} /> Мой компьютер
        </h2>
        <Card>
          {profile?.pcSpecs ? (
            <div className={styles['profile__specs-grid']}>
              {Object.entries(profile.pcSpecs).map(([key, value]) => (
                <div key={key} className={styles['profile__spec-item']}>
                  <span className={styles['profile__spec-label']}>{key}</span>
                  <span className={styles['profile__spec-value']}>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <Card.Body>
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Ты ещё не добавил характеристики своего ПК.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-4)' }}>
                <Button variant="secondary" size="sm">
                  Указать характеристики
                </Button>
              </div>
            </Card.Body>
          )}
        </Card>
      </div>
    </motion.div>
  )
}
