import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { motion } from 'framer-motion'
import { Monitor, Settings, LogOut, Save, X, Edit3 } from 'lucide-react'
import { Button, Card, Avatar, Input } from '@/shared/ui'
import useAuthStore from '@/stores/authStore'
import styles from './Profile.module.css'

export default function ProfilePage() {
  const { id } = useParams()
  const { user, profile: myProfile, loading: authLoading, signOut, saveProfile, fetchPublicProfile, updateUserRole } = useAuthStore()
  const isAuthenticated = !!user
  const navigate = useNavigate()

  const isMyProfile = !id || id === user?.uid
  const isAdmin = myProfile?.role === 'admin'

  const [fetchedProfile, setFetchedProfile] = useState({ id: null, data: null })

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nickname: '',
    avatarUrl: '',
    pcSpecs: '',
  })

  // Admin role edit state
  const [editingRole, setEditingRole] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [savingRole, setSavingRole] = useState(false)

  useEffect(() => {
    if (authLoading || isMyProfile) {
      return
    }

    let isMounted = true
    fetchPublicProfile(id).then(data => {
      if (isMounted) {
        setFetchedProfile({ id, data })
      }
    })
    return () => { isMounted = false }
  }, [id, authLoading, isMyProfile, fetchPublicProfile])

  const loadingTarget = !isMyProfile && fetchedProfile.id !== id
  const targetProfile = isMyProfile
    ? myProfile
    : fetchedProfile.id === id ? fetchedProfile.data : null

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleStartEditing = () => {
    setForm({
      nickname: targetProfile?.nickname || targetProfile?.displayName || '',
      avatarUrl: targetProfile?.avatarUrl || '',
      pcSpecs: targetProfile?.pcSpecs || '',
    })
    setEditing(true)
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

  const handleSaveRole = async () => {
    if (!newRole.trim()) return
    setSavingRole(true)
    const success = await updateUserRole(id, newRole.trim())
    if (success) {
      setFetchedProfile(prev => ({
        ...prev,
        data: prev.data ? { ...prev.data, role: newRole.trim() } : prev.data,
      }))
      setEditingRole(false)
    }
    setSavingRole(false)
  }

  if (authLoading || loadingTarget) {
    return (
      <motion.div
        className={styles.profile}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className={styles.profile__guest}>
          <p style={{ color: 'var(--color-text-muted)' }}>Загрузка профиля...</p>
        </div>
      </motion.div>
    )
  }

  if (isMyProfile && (!isAuthenticated || !user)) {
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

  if (!targetProfile && !isMyProfile) {
    return (
      <motion.div
        className={styles.profile}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className={styles.profile__guest}>
          <h2 className={styles['profile__guest-title']}>Профиль не найден</h2>
          <p className={styles['profile__guest-desc']}>
            Возможно, ссылка неверна или пользователь был удален
          </p>
          <Link to="/">
            <Button variant="secondary">На главную</Button>
          </Link>
        </div>
      </motion.div>
    )
  }

  const displayName = targetProfile?.nickname || targetProfile?.displayName || targetProfile?.email || "Пользователь"
  const avatarSrc = targetProfile?.avatarUrl || (isMyProfile ? user?.photoURL : '')

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

          {editing && isMyProfile ? (
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
              <div className={styles.profile__nameContainer}>
                <h1 className={styles.profile__name}>{displayName}</h1>
                {targetProfile?.role && (
                  <span className={styles.profile__roleBadge} data-role={targetProfile.role}>
                    {targetProfile.role}
                  </span>
                )}
              </div>
              
              {targetProfile?.email && <p className={styles.profile__email}>{targetProfile.email}</p>}
              
              {targetProfile?.createdAt && (
                <p className={styles.profile__joined}>
                  На платформе с {new Date(targetProfile.createdAt).toLocaleDateString('ru-RU')}
                </p>
              )}

              {isAdmin && !isMyProfile && (
                <div className={styles.profile__adminRow}>
                  {editingRole ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginTop: '12px' }}>
                      <Input 
                        value={newRole} 
                        onChange={e => setNewRole(e.target.value)} 
                        placeholder="Назначить роль"
                      />
                      <Button size="sm" onClick={handleSaveRole} disabled={savingRole} icon={Save}>
                        Сохранить
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingRole(false)} icon={X}>
                        Отмена
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => { setNewRole(targetProfile?.role || ''); setEditingRole(true) }} icon={Edit3}>
                      Выдать роль
                    </Button>
                  )}
                </div>
              )}

              {isMyProfile && (
                <div className={styles.profile__actions}>
                  <Button variant="secondary" size="sm" icon={Settings} onClick={handleStartEditing}>
                    Редактировать
                  </Button>
                  <Button variant="ghost" size="sm" icon={LogOut} onClick={handleSignOut}>
                    Выйти
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* PC Specs */}
      <div className={styles.profile__section}>
        <h2 className={styles['profile__section-title']}>
          <Monitor size={20} /> Компьютер
        </h2>
        <Card>
          {editing && isMyProfile ? (
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
          ) : targetProfile?.pcSpecs ? (
            <div style={{ padding: 'var(--space-5)', whiteSpace: 'pre-wrap', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              {targetProfile.pcSpecs}
            </div>
          ) : (
            <Card.Body>
              <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                {isMyProfile ? 'Ты ещё не добавил характеристики своего ПК.' : 'Пользователь не указал характеристики своего ПК.'}
              </p>
              {isMyProfile && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-4)' }}>
                  <Button variant="secondary" size="sm" onClick={handleStartEditing}>
                    Указать характеристики
                  </Button>
                </div>
              )}
            </Card.Body>
          )}
        </Card>
      </div>
    </motion.div>
  )
}
