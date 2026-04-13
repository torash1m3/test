import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Cpu, GripVertical, MessageSquare, User, Calculator, Truck } from 'lucide-react'
import { Button, Card } from '@/shared/ui'
import styles from './Home.module.css'

const FEATURES = [
  {
    icon: Cpu,
    title: 'Конструктор ПК',
    desc: 'Собирай свой идеальный компьютер вручную — никаких ограничений и навязанных списков.',
  },
  {
    icon: GripVertical,
    title: 'Drag & Drop',
    desc: 'Перетаскивай комплектующие между категориями одним движением.',
  },
  {
    icon: Calculator,
    title: 'Калькулятор цен',
    desc: 'Мгновенный подсчёт стоимости всей сборки и каждой категории отдельно.',
  },
  {
    icon: Truck,
    title: 'Трекер покупок',
    desc: 'Отслеживай статус каждой комплектующей: от планирования до доставки.',
  },
  {
    icon: MessageSquare,
    title: 'Форум',
    desc: 'Обсуждай новости, делись опытом и общайся с комьюнити энтузиастов.',
  },
  {
    icon: User,
    title: 'Профили',
    desc: 'Показывай свой сетап всем пользователям: что за зверь стоит под столом.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={`${styles.hero__glow} ${styles['hero__glow--purple']}`} />
        <div className={`${styles.hero__glow} ${styles['hero__glow--cyan']}`} />

        <motion.div
          className={styles.hero__badge}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Cpu size={14} /> Платформа v0.1
        </motion.div>

        <motion.h1
          className={styles.hero__title}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Собери свой{' '}
          <span className="gradient-text">идеальный ПК</span>
        </motion.h1>

        <motion.p
          className={styles.hero__subtitle}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Планируй комплектующие, отслеживай покупки и делись сборками с комьюнити — всё в одном месте.
        </motion.p>

        <motion.div
          className={styles.hero__actions}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Link to="/builder">
            <Button variant="primary" size="lg">
              Начать сборку
            </Button>
          </Link>
          <Link to="/forum">
            <Button variant="secondary" size="lg">
              Перейти на форум
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <h2 className={styles.features__title}>
          Всё что нужно <span className="gradient-text">в одном месте</span>
        </h2>
        <p className={styles.features__subtitle}>
          Инструменты для энтузиастов, которые знают чего хотят.
        </p>

        <div className={styles.features__grid}>
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
            >
              <Card interactive glow>
                <div className={styles['feature-card__icon']}>
                  <feat.icon size={24} />
                </div>
                <h3 className={styles['feature-card__title']}>{feat.title}</h3>
                <p className={styles['feature-card__desc']}>{feat.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  )
}
