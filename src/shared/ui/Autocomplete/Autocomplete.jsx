import { useState, useRef, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import styles from './Autocomplete.module.css'

/**
 * Autocomplete — поисковый инпут с выпадающим списком подсказок.
 *
 * Props:
 *   items       — массив объектов { name, ...attrs }
 *   onSelect    — (item) => void — вызывается при выборе
 *   onManual    — (name) => void — вызывается если пользователь вводит вручную
 *   renderMeta  — (item) => ReactNode — доп. инфо в каждой строке
 *   placeholder — текст placeholder
 *   label       — label для поля
 *   value       — controlled value
 *   onChange    — controlled onChange
 */
export default function Autocomplete({
  items = [],
  onSelect,
  renderMeta,
  placeholder = 'Начни вводить...',
  label,
  value = '',
  onChange,
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  // Sync external value
  useEffect(() => {
    setQuery(value)
  }, [value])

  const filtered = query.trim().length > 0
    ? items.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 30)
    : items.slice(0, 30)

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setOpen(true)
    setActiveIdx(-1)
    onChange?.(val)
  }

  const handleSelect = useCallback(
    (item) => {
      setQuery(item.name)
      setOpen(false)
      setActiveIdx(-1)
      onChange?.(item.name)
      onSelect?.(item)
    },
    [onSelect, onChange]
  )

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown') {
        setOpen(true)
        return
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIdx((prev) => Math.min(prev + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIdx((prev) => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIdx >= 0 && filtered[activeIdx]) {
          handleSelect(filtered[activeIdx])
        }
        break
      case 'Escape':
        setOpen(false)
        setActiveIdx(-1)
        break
    }
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            width: '100%',
            padding: 'var(--space-3) var(--space-4)',
            paddingLeft: '36px',
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm)',
            transition: 'all var(--transition-base)',
            outline: 'none',
          }}
        />
      </div>

      {open && (
        <div className={styles.dropdown}>
          {filtered.length > 0 ? (
            filtered.map((item, idx) => (
              <div
                key={item.name}
                className={`${styles.item} ${idx === activeIdx ? styles['item--active'] : ''}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIdx(idx)}
              >
                <span className={styles.item__name}>{item.name}</span>
                {renderMeta && (
                  <div className={styles.item__meta}>{renderMeta(item)}</div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.empty}>
              Ничего не найдено — введи вручную
            </div>
          )}
        </div>
      )}

      <div className={styles['manual-hint']}>
        {items.length > 0 ? 'Выбери из списка или введи вручную' : ''}
      </div>
    </div>
  )
}
