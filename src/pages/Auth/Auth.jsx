import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { Button, Card, Input } from '@/shared/ui'
import useAuthStore from '@/stores/authStore'
import styles from './Auth.module.css'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ displayName: '', email: '', password: '' })
  const { signIn, signUp, signInWithGoogle, error, loading, clearError } =
    useAuthStore()
  const navigate = useNavigate()

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    clearError()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    let result

    if (isLogin) {
      result = await signIn(form.email, form.password)
    } else {
      result = await signUp(form.email, form.password, form.displayName)
    }

    if (result.success) {
      navigate('/profile')
    }
  }

  const handleGoogle = async () => {
    const result = await signInWithGoogle()
    if (result.success) {
      navigate('/profile')
    }
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
          {!isLogin && (
            <Input
              label="Имя"
              placeholder="Neo Builder"
              value={form.displayName}
              onChange={handleChange('displayName')}
              required
            />
          )}
          <Input
            label="Email"
            type="email"
            placeholder="builder@neoforge.dev"
            value={form.email}
            onChange={handleChange('email')}
            required
          />
          <Input
            label="Пароль"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange('password')}
            required
            minLength={6}
          />

          {error && (
            <div className={styles.auth__error}>{error}</div>
          )}

          <Button
            variant="primary"
            size="lg"
            type="submit"
            className={styles.auth__submit}
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </Button>
        </form>

        {/* Разделитель */}
        <div className={styles.auth__divider}>
          <span>или</span>
        </div>

        {/* Google */}
        <Button
          variant="secondary"
          size="lg"
          style={{ width: '100%' }}
          onClick={handleGoogle}
          disabled={loading}
        >
          Войти через Google
        </Button>

        <div className={styles.auth__toggle}>
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button
            className={styles['auth__toggle-link']}
            onClick={() => { setIsLogin(!isLogin); clearError() }}
            type="button"
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </div>
      </Card>
    </motion.div>
  )
}
