import { useState } from 'react'
import styles from './Avatar.module.css'

export default function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  ring = false,
  className = '',
}) {
  const [failedSrc, setFailedSrc] = useState('')
  const imgError = !!src && failedSrc === src

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
      {src && !imgError ? (
        <img src={src} alt={alt || name} onError={() => setFailedSrc(src)} />
      ) : (
        initials || '?'
      )}
    </div>
  )
}
