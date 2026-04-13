import { Navigate, useLocation } from 'react-router'
import useAuthStore from '@/stores/authStore'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--font-size-sm)',
      }}>
        Проверка доступа...
      </div>
    )
  }

  if (!user) {
    // Редирект на auth, запоминаем откуда пришли
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}
