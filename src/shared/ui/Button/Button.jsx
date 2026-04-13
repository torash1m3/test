import styles from './Button.module.css'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconOnly = false,
  className = '',
  ...props
}) {
  const classes = [
    styles.btn,
    styles[`btn--${variant}`],
    size !== 'md' && styles[`btn--${size}`],
    iconOnly && styles['btn--icon'],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} {...props}>
      {Icon && <Icon size={iconOnly ? 20 : 16} />}
      {!iconOnly && children}
    </button>
  )
}
