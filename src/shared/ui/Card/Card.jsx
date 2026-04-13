import styles from './Card.module.css'

export default function Card({
  children,
  interactive = false,
  glow = false,
  compact = false,
  flush = false,
  className = '',
  ...props
}) {
  const classes = [
    styles.card,
    interactive && styles['card--interactive'],
    glow && styles['card--glow'],
    compact && styles['card--compact'],
    flush && styles['card--flush'],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ children, className = '' }) {
  return <div className={`${styles.card__header} ${className}`}>{children}</div>
}

Card.Title = function CardTitle({ children, className = '' }) {
  return <h3 className={`${styles.card__title} ${className}`}>{children}</h3>
}

Card.Subtitle = function CardSubtitle({ children, className = '' }) {
  return <p className={`${styles.card__subtitle} ${className}`}>{children}</p>
}

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={`${styles.card__body} ${className}`}>{children}</div>
}

Card.Footer = function CardFooter({ children, className = '' }) {
  return <div className={`${styles.card__footer} ${className}`}>{children}</div>
}
