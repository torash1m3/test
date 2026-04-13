import { forwardRef } from 'react'
import styles from './Input.module.css'

const Input = forwardRef(function Input(
  {
    label,
    error,
    textarea = false,
    className = '',
    id,
    ...props
  },
  ref
) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`
  const Component = textarea ? 'textarea' : 'input'

  const inputClasses = [
    styles.input,
    textarea && styles.textarea,
    error && styles['input--error'],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <Component
        ref={ref}
        id={inputId}
        className={inputClasses}
        aria-invalid={!!error}
        {...props}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
})

export default Input
