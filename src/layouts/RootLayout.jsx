import { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router'
import { Cpu, Menu, X, LogIn } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '@/stores/authStore'
import { Button, Avatar } from '@/shared/ui'
import styles from './RootLayout.module.css'

const NAV_LINKS = [
  { to: '/', label: 'Главная' },
  { to: '/builder', label: 'Конструктор' },
  { to: '/forum', label: 'Форум' },
]

export default function RootLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuthStore()
  const isAuthenticated = !!user

  const toggleMobile = () => setMobileOpen((prev) => !prev)
  const closeMobile = () => setMobileOpen(false)

  return (
    <div className={styles.layout}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navbar__inner}>
          {/* Logo */}
          <Link to="/" className={styles.navbar__logo}>
            <Cpu size={28} className={styles['navbar__logo-icon']} />
            <span className={styles['navbar__logo-text']}>NeoForge</span>
          </Link>

          {/* Desktop Links */}
          <div className={styles.navbar__links}>
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `${styles.navbar__link} ${isActive ? styles['navbar__link--active'] : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Actions */}
          <div className={styles.navbar__actions}>
            {isAuthenticated ? (
              <Link to="/profile">
                <Avatar
                  src={user?.photoURL}
                  name={user?.displayName || user?.email || 'U'}
                  size="sm"
                />
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="primary" size="sm" icon={LogIn}>
                  Войти
                </Button>
              </Link>
            )}

            {/* Mobile burger */}
            <button
              className={styles.navbar__burger}
              onClick={toggleMobile}
              aria-label="Меню"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className={`${styles['mobile-menu']} ${styles['mobile-menu--open']}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `${styles['mobile-menu__link']} ${isActive ? styles['mobile-menu__link--active'] : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {!isAuthenticated && (
              <Link to="/auth" onClick={closeMobile}>
                <Button variant="primary" icon={LogIn} style={{ width: '100%', marginTop: 'var(--space-4)' }}>
                  Войти
                </Button>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footer__inner}>
          <span className={styles.footer__copy}>
            © 2026 NeoForge. Собери мечту.
          </span>
          <div className={styles.footer__links}>
            <Link to="/" className={styles.footer__link}>Главная</Link>
            <Link to="/forum" className={styles.footer__link}>Форум</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
