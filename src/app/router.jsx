import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router'
import RootLayout from '@/layouts/RootLayout'

// Lazy-loaded pages — грузятся только по требованию
const Home = lazy(() => import('@/pages/Home/Home'))
const Builder = lazy(() => import('@/pages/Builder/Builder'))
const Forum = lazy(() => import('@/pages/Forum/Forum'))
const Profile = lazy(() => import('@/pages/Profile/Profile'))
const Auth = lazy(() => import('@/pages/Auth/Auth'))
const NotFound = lazy(() => import('@/pages/NotFound/NotFound'))

function LazyPage({ Component }) {
  return (
    <Suspense
      fallback={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
        }}>
          Загрузка...
        </div>
      }
    >
      <Component />
    </Suspense>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <LazyPage Component={Home} /> },
      { path: 'builder', element: <LazyPage Component={Builder} /> },
      { path: 'forum', element: <LazyPage Component={Forum} /> },
      { path: 'profile', element: <LazyPage Component={Profile} /> },
      { path: 'auth', element: <LazyPage Component={Auth} /> },
      { path: '*', element: <LazyPage Component={NotFound} /> },
    ],
  },
])

export default router
