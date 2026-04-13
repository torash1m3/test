import styles from './Avatar.module.css'

export default function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  ring = false,
  className = '',
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

  const classes = [
    styles.avatar,
    styles[`avatar--${size}`],
    ring && styles['avatar--ring'],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} title={name || alt}>
      {src ? <img src={src} alt={alt || name} /> : initials}
    </div>
  )
}
