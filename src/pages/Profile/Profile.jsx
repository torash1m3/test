import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Monitor, Settings, LogOut, Save, X } from 'lucide-react'
import { Button, Card, Avatar, Input } from '@/shared/ui'
import useAuthStore from '@/stores/authStore'
import styles from './Profile.module.css'

export default function ProfilePage() {
  const { user, profile, loading, signOut, saveProfile } = useAuthStore()
  const isAuthenticated = !!user
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nickname: '',
    avatarUrl: '',
    pcSpecs: '',
  })

  // Sync form with profile
  useEffect(() => {
    if (profile) {
      setForm({
        nickname: profile.nickname || profile.displayName || '',
        avatarUrl: profile.avatarUrl || '',
        pcSpecs: profile.pcSpecs || '',
      })
    }
  }, [profile])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSave = async () => {
    setSaving(true)
    await saveProfile(form)
    setSaving(false)
    setEditing(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

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

  const displayName = profile?.nickname || user.displayName || user.email
  const avatarSrc = profile?.avatarUrl || user.photoURL

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
            src={avatarSrc}
            name={displayName}
            size="xl"
            ring
          />

          {editing ? (
            <div className={styles.profile__edit}>
              <Input
                label="Никнейм"
                value={form.nickname}
                onChange={handleChange('nickname')}
                placeholder="Твой ник"
                maxLength={50}
              />
              <Input
                label="URL аватарки"
                value={form.avatarUrl}
                onChange={handleChange('avatarUrl')}
                placeholder="https://i.imgur.com/..."
                maxLength={500}
              />
              <div className={styles.profile__edit_actions}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Save}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={X}
                  onClick={() => setEditing(false)}
                >
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className={styles.profile__name}>{displayName}</h1>
              <p className={styles.profile__email}>{user.email}</p>
              {profile?.createdAt && (
                <p className={styles.profile__joined}>
                  На платформе с {new Date(profile.createdAt).toLocaleDateString('ru-RU')}
                </p>
              )}
              <div className={styles.profile__actions}>
                <Button variant="secondary" size="sm" icon={Settings} onClick={() => setEditing(true)}>
                  Редактировать
                </Button>
                <Button variant="ghost" size="sm" icon={LogOut} onClick={handleSignOut}>
                  Выйти
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* PC Specs */}
      <div className={styles.profile__section}>
        <h2 className={styles['profile__section-title']}>
          <Monitor size={20} /> Мой компьютер
        </h2>
        <Card>
          {editing ? (
            <div style={{ padding: 'var(--space-5)' }}>
              <Input
                label="Характеристики ПК"
                textarea
                placeholder="CPU: Ryzen 7 7800X3D&#10;GPU: RTX 5070&#10;RAM: 32GB DDR5&#10;..."
                value={form.pcSpecs}
                onChange={handleChange('pcSpecs')}
                style={{ minHeight: '120px' }}
                maxLength={2000}
              />
            </div>
          ) : profile?.pcSpecs ? (
            <div style={{ padding: 'var(--space-5)', whiteSpace: 'pre-wrap', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              {profile.pcSpecs}
            </div>
          ) : (
            <Card.Body>
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Ты ещё не добавил характеристики своего ПК.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-4)' }}>
                <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
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
