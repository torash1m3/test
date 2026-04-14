import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Cpu, CheckCircle2, AlertTriangle, User, MessageSquare, Zap, BadgeCheck } from 'lucide-react'
import { Button } from '@/shared/ui'
import styles from './Home.module.css'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
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

        <div className={styles.hero__content}>
          <motion.div
            className={styles.hero__badge}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Zap size={14} fill="currentColor" /> Платформа NeoForge
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
            Планируй комплектующие, отслеживай покупки и проверяй совместимость с помощью умных алгоритмов. Мощный инструмент для энтузиастов.
          </motion.p>

          <motion.div
            className={styles.hero__actions}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Link to="/builder">
              <Button variant="primary" size="lg">
                Конструктор ПК
              </Button>
            </Link>
            <Link to="/forum">
              <Button variant="secondary" size="lg">
                Перейти на форум
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className={styles.hero__visuals}>
          {/* Glass Badges */}
          <div className={`${styles['glass-badge']} ${styles['glass-badge--1']}`}>
            <CheckCircle2 size={16} color="var(--color-success)" />
            <span>Совместимость 100%</span>
          </div>
          <div className={`${styles['glass-badge']} ${styles['glass-badge--2']}`}>
            <Zap size={16} color="var(--color-warning)" />
            <span>TDP 450W</span>
          </div>

          <div className={`${styles['hero__img-container']} ${styles['hero__img-container--gpu']}`}>
            <img src="/GPU.png" alt="GPU" className={styles.hero__img} />
          </div>
          <div className={`${styles['hero__img-container']} ${styles['hero__img-container--cpu']}`}>
            <img src="/CPU.png" alt="CPU" className={styles.hero__img} />
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className={styles.bento}>
        <div className={styles.bento__header}>
          <motion.h2 
            className={styles.bento__title}
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          >
            Всё что нужно <span className="gradient-text">в одном месте</span>
          </motion.h2>
          <motion.p 
            className={styles.bento__subtitle}
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          >
            Никаких шаблонов — только полная свобода в выборе с автоматической защитой от критических ошибок при сборке.
          </motion.p>
        </div>

        <div className={styles.bento__grid}>
          {/* Конструктор (Large) */}
          <motion.div 
            className={`${styles['bento-card']} ${styles['bento-card--large']}`}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp} custom={2}
          >
            <div className={`${styles['bento-card__badge']} ${styles['bento-card__badge--purple']}`}>
              <Cpu size={24} />
            </div>
            <h3 className={styles['bento-card__title']}>Ультимативный конструктор</h3>
            <p className={styles['bento-card__desc']}>Собирай сетап своей мечты. Добавляй кастомные детали, учитывай все нюансы и выжимай максимум.</p>
            
            <div className={styles['demo-builder']}>
              <div className={styles['demo-builder__row']}>
                <span>AMD Ryzen 7 7800X3D</span>
                <span style={{color: 'var(--color-cyan)'}}>39 990 ₽</span>
              </div>
              <div className={styles['demo-builder__row']}>
                <span>GeForce RTX 4070 Ti SUPER</span>
                <span style={{color: 'var(--color-cyan)'}}>95 990 ₽</span>
              </div>
            </div>
          </motion.div>

          {/* Совместимость (Wide) */}
          <motion.div 
            className={`${styles['bento-card']} ${styles['bento-card--wide']}`}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp} custom={3}
          >
            <div className={`${styles['bento-card__badge']} ${styles['bento-card__badge--green']}`}>
              <BadgeCheck size={24} />
            </div>
            <h3 className={styles['bento-card__title']}>Умная совместимость</h3>
            <p className={styles['bento-card__desc']}>Длина видюхи, TDP башни, форм-фактор — мы следим, чтобы всё идеально влезло в корпус.</p>
            
            <div className={styles['demo-compat']}>
              <div className={`${styles['demo-compat__item']} ${styles['demo-compat__item--success']}`}>
                <CheckCircle2 size={16} /> Кулер подходит по тепловыделению
              </div>
              <div className={`${styles['demo-compat__item']} ${styles['demo-compat__item--warning']}`}>
                <AlertTriangle size={16} /> Видеокарта влезает впритык (запас 12мм)
              </div>
            </div>
          </motion.div>

          {/* Статусы (Square) */}
          <motion.div 
            className={`${styles['bento-card']} ${styles['bento-card--square']}`}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp} custom={4}
          >
            <h3 className={styles['bento-card__title']}>Трекер статусов</h3>
            <p className={styles['bento-card__desc']}>Отслеживай закупки.</p>
            
            <div className={styles['demo-stepper']}>
              <div className={`${styles['demo-stepper__dot']} ${styles['demo-stepper__dot--active']}`} style={{background: 'var(--color-text-muted)', boxShadow: 'none'}} />
              <div className={`${styles['demo-stepper__dot']} ${styles['demo-stepper__dot--active']}`} style={{background: 'var(--color-info)', boxShadow: 'none'}} />
              <div className={`${styles['demo-stepper__dot']} ${styles['demo-stepper__dot--active']}`} style={{background: 'var(--color-warning)'}} />
              <div className={styles['demo-stepper__dot']} />
            </div>
          </motion.div>

          {/* Калькулятор (Square) */}
          <motion.div 
            className={`${styles['bento-card']} ${styles['bento-card--square']}`}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp} custom={5}
          >
            <h3 className={styles['bento-card__title']}>Калькулятор</h3>
            <p className={styles['bento-card__desc']}>Контроль бюджета.</p>
            <div className={styles['demo-price']}>145k</div>
          </motion.div>

          {/* Форум и Профили (Wide) */}
          <motion.div 
            className={`${styles['bento-card']} ${styles['bento-card--wide']}`}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp} custom={6}
          >
            <div className={`${styles['bento-card__badge']} ${styles['bento-card__badge--cyan']}`}>
              <MessageSquare size={24} />
            </div>
            <h3 className={styles['bento-card__title']}>Комьюнити гиков</h3>
            <p className={styles['bento-card__desc']}>Делись сетапами, обсуждай новинки на форуме и помогай новичкам собрать их мечту.</p>
            
            <div className={styles['demo-profiles']}>
              <div className={styles['demo-profiles__avatar']}><User size={20}/></div>
              <div className={styles['demo-profiles__avatar']}><User size={20}/></div>
              <div className={styles['demo-profiles__avatar']}><User size={20}/></div>
              <div className={styles['demo-profiles__avatar']} style={{fontSize: 12, fontWeight: 600}}>+99</div>
            </div>
          </motion.div>

        </div>
      </section>
    </>
  )
}
