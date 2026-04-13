import { forwardRef } from 'react'
import styles from './Select.module.css'

const Select = forwardRef(function Select(
  { label, options = [], placeholder, className = '', id, ...props },
  ref
) {
  const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`${styles.select} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => {
          const value = typeof opt === 'string' ? opt : opt.value
          const label = typeof opt === 'string' ? opt : opt.label
          return (
            <option key={value} value={value}>
              {label}
            </option>
          )
        })}
      </select>
    </div>
  )
})

export default Select
