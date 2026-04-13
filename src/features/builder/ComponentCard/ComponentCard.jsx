import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, StickyNote } from 'lucide-react'
import { StatusBadge } from '@/shared/ui'
import styles from './ComponentCard.module.css'

export default function ComponentCard({
  component,
  onStatusClick,
  onDelete,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isDragging ? styles['card--dragging'] : ''}`}
    >
      {/* Drag handle */}
      <div className={styles['drag-handle']} {...attributes} {...listeners}>
        <GripVertical size={16} />
      </div>

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

      {/* Status */}
      <StatusBadge
        status={component.status}
        clickable
        onClick={() => onStatusClick(component.id)}
      />

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
