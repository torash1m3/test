import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Button } from '@/shared/ui'
import styles from './NotFound.module.css'

export default function NotFoundPage() {
  return (
    <motion.div
      className={styles['not-found']}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles['not-found__code']}>404</div>
      <h1 className={styles['not-found__title']}>Страница не найдена</h1>
      <p className={styles['not-found__desc']}>
        Похоже, эта комплектующая потерялась при доставке. Вернись на главную.
      </p>
      <Link to="/">
        <Button variant="primary">На главную</Button>
      </Link>
    </motion.div>
  )
}
