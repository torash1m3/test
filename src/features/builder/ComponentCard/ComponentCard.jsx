import { Trash2, StickyNote } from 'lucide-react'
import styles from './ComponentCard.module.css'

const STATUSES = [
  { key: 'planned', label: 'Планирую', color: 'var(--color-text-muted)' },
  { key: 'ordered', label: 'Заказано', color: 'var(--color-info, #3b82f6)' },
  { key: 'purchased', label: 'Куплено', color: 'var(--color-warning, #f59e0b)' },
  { key: 'delivered', label: 'Доставлено', color: 'var(--color-success, #22c55e)' },
]

export default function ComponentCard({
  component,
  onStatusChange,
  onDelete,
}) {
  const currentIdx = STATUSES.findIndex((s) => s.key === component.status)

  return (
    <div className={styles.card}>
      {/* Info */}
      <div className={styles.info}>
        <div className={styles.name} title={component.name}>
          {component.name}
        </div>
        <div className={styles.meta}>
          {component.price > 0 && (
            <span className={styles.price}>
              {component.price.toLocaleString('ru-RU')} ₽
            </span>
          )}
          {component.notes && (
            <span className={styles['notes-indicator']} title={component.notes}>
              <StickyNote size={12} />
            </span>
          )}
        </div>
      </div>

      {/* Stepper */}
      <div className={styles.stepper}>
        {STATUSES.map((s, idx) => {
          const isActive = idx <= currentIdx
          const isCurrent = idx === currentIdx
          return (
            <button
              key={s.key}
              className={`${styles.stepper__dot} ${isActive ? styles['stepper__dot--active'] : ''} ${isCurrent ? styles['stepper__dot--current'] : ''}`}
              style={isActive ? { '--dot-color': s.color } : undefined}
              onClick={() => onStatusChange(component.id, s.key)}
              title={s.label}
              aria-label={s.label}
            />
          )
        })}
        <span className={styles.stepper__label}>
          {STATUSES[currentIdx]?.label}
        </span>
      </div>

      {/* Delete */}
      <button
        className={`${styles['action-btn']} ${styles['action-btn--danger']}`}
        onClick={() => onDelete(component.id)}
        aria-label="Удалить"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
