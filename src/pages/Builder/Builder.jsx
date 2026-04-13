import { motion } from 'framer-motion'
import { Plus, Package } from 'lucide-react'
import { Button, Card } from '@/shared/ui'
import useBuilderStore from '@/stores/builderStore'
import styles from './Builder.module.css'

export default function BuilderPage() {
  const { builds, activeBuildId, categories, categoryLabels, createBuild, getActiveBuild, getTotalPrice, getProgress } = useBuilderStore()
  const activeBuild = getActiveBuild()

  const handleCreateBuild = () => {
    const name = prompt('Название сборки:')
    if (name?.trim()) {
      createBuild(name.trim())
    }
  }

  return (
    <motion.div
      className={styles.builder}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.builder__header}>
        <h1 className={styles.builder__title}>
          Конструктор <span className="gradient-text">ПК</span>
        </h1>
        <Button variant="primary" icon={Plus} onClick={handleCreateBuild}>
          Новая сборка
        </Button>
      </div>

      {activeBuild ? (
        <div className={styles.builder__layout}>
          {/* Workspace — категории с drag-drop зонами */}
          <div className={styles.builder__workspace}>
            {categories.map((cat) => (
              <div key={cat} className={styles['category-zone']}>
                <div className={styles['category-zone__header']}>
                  <span className={styles['category-zone__title']}>
                    {categoryLabels[cat]}
                  </span>
                  <Button variant="ghost" size="sm" icon={Plus} iconOnly aria-label={`Добавить ${categoryLabels[cat]}`} />
                </div>
                <div className={styles['category-zone__empty']}>
                  Перетащи или добавь комплектующую
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar — калькулятор */}
          <div className={styles.sidebar}>
            <Card>
              <Card.Header>
                <Card.Title>{activeBuild.name}</Card.Title>
                <Card.Subtitle>
                  {activeBuild.components.length} компонентов
                </Card.Subtitle>
              </Card.Header>
              <Card.Body>
                <div className={styles.sidebar__total}>
                  <span className={styles['sidebar__total-label']}>Итого</span>
                  <span className={styles['sidebar__total-value']}>
                    {getTotalPrice(activeBuild.id).toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                <div style={{ marginTop: 'var(--space-4)' }}>
                  <div className={styles['sidebar__progress-bar']}>
                    <div
                      className={styles['sidebar__progress-fill']}
                      style={{ width: `${getProgress(activeBuild.id)}%` }}
                    />
                  </div>
                  <p className={styles['sidebar__progress-label']}>
                    Прогресс покупок: {getProgress(activeBuild.id)}%
                  </p>
                </div>
              </Card.Body>
            </Card>

            <Card compact>
              <Card.Body>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  Перетаскивай комплектующие для сортировки. Нажми + чтобы добавить новую деталь.
                </p>
              </Card.Body>
            </Card>
          </div>
        </div>
      ) : (
        <div className={styles.builder__empty}>
          <Package size={48} color="var(--color-text-muted)" style={{ marginInline: 'auto', marginBottom: 'var(--space-4)' }} />
          <h2 className={styles['builder__empty-title']}>Нет активных сборок</h2>
          <p className={styles['builder__empty-desc']}>
            Создай свою первую сборку и начни добавлять комплектующие
          </p>
          <Button variant="primary" icon={Plus} onClick={handleCreateBuild}>
            Создать сборку
          </Button>
        </div>
      )}
    </motion.div>
  )
}
