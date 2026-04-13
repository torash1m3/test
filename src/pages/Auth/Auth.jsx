import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Button, Card, Input } from '@/shared/ui'
import useAuthStore from '@/stores/authStore'
import styles from './Auth.module.css'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const { login, register } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isLogin) {
      login({ username: form.username, email: form.email })
    } else {
      register({ username: form.username, email: form.email })
    }
    navigate('/profile')
  }

  return (
    <motion.div
      className={styles.auth}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={styles.auth__card} glow>
        <div className={styles.auth__header}>
          <h1 className={styles.auth__title}>
            {isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}
          </h1>
          <p className={styles.auth__subtitle}>
            {isLogin
              ? 'Войди, чтобы продолжить сборку'
              : 'Присоединяйся к комьюнити NeoForge'}
          </p>
        </div>

        <form className={styles.auth__form} onSubmit={handleSubmit}>
          <Input
            label="Имя пользователя"
            placeholder="neo_builder"
            value={form.username}
            onChange={handleChange('username')}
            required
          />
          {!isLogin && (
            <Input
              label="Email"
              type="email"
              placeholder="builder@neoforge.dev"
              value={form.email}
              onChange={handleChange('email')}
              required
            />
          )}
          <Input
            label="Пароль"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange('password')}
            required
          />
          <Button
            variant="primary"
            size="lg"
            type="submit"
            className={styles.auth__submit}
            style={{ width: '100%' }}
          >
            {isLogin ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>

        <div className={styles.auth__toggle}>
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button
            className={styles['auth__toggle-link']}
            onClick={() => setIsLogin(!isLogin)}
            type="button"
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </div>
      </Card>
    </motion.div>
  )
}
