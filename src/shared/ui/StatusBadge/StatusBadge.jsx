import styles from './StatusBadge.module.css'

const STATUS_LABELS = {
  planned: 'Планирую',
  ordered: 'Заказано',
  purchased: 'Куплено',
  delivered: 'Доставлено',
}

export default function StatusBadge({
  status,
  variant,
  label,
  clickable = false,
  onClick,
  children,
  className = '',
}) {
  const displayLabel = label || STATUS_LABELS[status] || children
  const variantClass = variant || status

  const classes = [
    styles.badge,
    styles[`badge--${variantClass}`],
    clickable && styles['badge--clickable'],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const Component = clickable ? 'button' : 'span'

  return (
    <Component className={classes} onClick={clickable ? onClick : undefined}>
      {displayLabel}
    </Component>
  )
}
