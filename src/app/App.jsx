import { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import router from './router'
import useAuthStore from '@/stores/authStore'

export default function App() {
  const init = useAuthStore((state) => state.init)

  useEffect(() => {
    init()
  }, [init])

  return <RouterProvider router={router} />
}
