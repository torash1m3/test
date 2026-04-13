import { useState, useMemo, useEffect } from 'react'
import { Button, Input, Modal, Select } from '@/shared/ui'
import Autocomplete from '@/shared/ui/Autocomplete/Autocomplete'
import { getSchemaForCategory, getEmptyAttrs, CATEGORY_SCHEMAS } from '@/features/builder/schemas'
import componentsDb from '@/data/components.json'
import styles from './AddComponentModal.module.css'

const categoryOptions = Object.entries(CATEGORY_SCHEMAS).map(([key, val]) => ({
  value: key,
  label: val.label,
}))

/**
 * Получить подсказки для атрибутов из БД по имени компонента.
 * Возвращает объект attrs (сокет, TDP и т.д.) или null.
 */
function lookupComponent(category, name) {
  const list = componentsDb[category]
  if (!list) return null
  return list.find((item) => item.name === name) || null
}

/**
 * Рендер мета-тегов в автокомплите — показываем ключевые атрибуты.
 */
function renderItemMeta(item) {
  const tags = []
  if (item.socket) tags.push(item.socket)
  if (item.tdp) tags.push(`${item.tdp}W`)
  if (item.formFactor) tags.push(item.formFactor)
  if (item.ramType) tags.push(item.ramType)
  if (item.wattage) tags.push(`${item.wattage}W`)
  if (item.coolingType) tags.push(item.coolingType)
  if (item.storageType) tags.push(item.storageType)
  if (item.capacity) tags.push(`${item.capacity}GB`)
  if (item.length) tags.push(`${item.length}mm`)

  return tags.map((tag) => (
    <span key={tag} style={{
      padding: '1px 6px',
      background: 'var(--color-accent-soft)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--color-accent-hover)',
      fontSize: '10px',
      fontWeight: 'var(--font-weight-medium)',
    }}>
      {tag}
    </span>
  ))
}

export default function AddComponentModal({ open, onClose, onAdd, defaultCategory = '' }) {
  const [category, setCategory] = useState(defaultCategory || 'cpu')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [attrs, setAttrs] = useState(() => getEmptyAttrs(defaultCategory || 'cpu'))
  const [autoFilled, setAutoFilled] = useState(false)

  const schema = useMemo(() => getSchemaForCategory(category), [category])

  // Список компонентов из БД для текущей категории
  const suggestions = useMemo(() => componentsDb[category] || [], [category])

  // Сброс при смене defaultCategory (когда пользователь жмёт + на конкретной категории)
  useEffect(() => {
    if (open && defaultCategory) {
      setCategory(defaultCategory)
      setAttrs(getEmptyAttrs(defaultCategory))
      setName('')
      setPrice('')
      setNotes('')
      setAutoFilled(false)
    }
  }, [open, defaultCategory])

  const handleCategoryChange = (e) => {
    const newCat = e.target.value
    setCategory(newCat)
    setAttrs(getEmptyAttrs(newCat))
    setName('')
    setAutoFilled(false)
  }

  const handleSelectFromDb = (item) => {
    setName(item.name)

    // Автозаполняем attrs из БД
    const newAttrs = { ...getEmptyAttrs(category) }
    const schemaAttrs = schema.attrs

    for (const attr of schemaAttrs) {
      if (item[attr.key] !== undefined) {
        newAttrs[attr.key] = item[attr.key]
      }
    }

    setAttrs(newAttrs)
    setAutoFilled(true)
  }

  const handleAttrChange = (key) => (e) => {
    setAttrs((prev) => ({ ...prev, [key]: e.target.value }))
    setAutoFilled(false)
  }

  const handleMultiselectToggle = (key, value) => {
    setAttrs((prev) => {
      const current = prev[key] || []
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [key]: next }
    })
    setAutoFilled(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    onAdd({
      name: name.trim(),
      category,
      price: Number(price) || 0,
      notes: notes.trim(),
      attrs,
    })

    // Reset
    setName('')
    setPrice('')
    setNotes('')
    setAttrs(getEmptyAttrs(category))
    setAutoFilled(false)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Добавить комплектующую"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!name.trim()}>
            Добавить
          </Button>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <Select
          label="Категория"
          options={categoryOptions}
          value={category}
          onChange={handleCategoryChange}
        />

        {/* Автокомплит из БД */}
        <Autocomplete
          label="Название"
          items={suggestions}
          value={name}
          onChange={(val) => { setName(val); setAutoFilled(false) }}
          onSelect={handleSelectFromDb}
          placeholder={`Начни вводить — ${suggestions.length} моделей в базе`}
          renderMeta={renderItemMeta}
        />

        <Input
          label="Цена (₽)"
          type="number"
          placeholder="28000"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min="0"
        />

        {/* Атрибуты совместимости */}
        {schema.attrs.length > 0 && (
          <>
            <div className={styles.form__divider}>
              Совместимость
              {autoFilled && (
                <span style={{
                  marginLeft: 'var(--space-2)',
                  color: 'var(--color-success)',
                  fontWeight: 'var(--font-weight-medium)',
                  textTransform: 'none',
                  letterSpacing: 'normal',
                }}>
                  ✓ заполнено из базы
                </span>
              )}
            </div>

            {schema.attrs.map((attr) => {
              if (attr.type === 'select') {
                return (
                  <Select
                    key={attr.key}
                    label={attr.label}
                    options={attr.options}
                    value={attrs[attr.key] || ''}
                    onChange={handleAttrChange(attr.key)}
                    placeholder="Выбрать..."
                  />
                )
              }

              if (attr.type === 'multiselect') {
                return (
                  <div key={attr.key}>
                    <div className={styles.multiselect__label}>{attr.label}</div>
                    <div className={styles.multiselect}>
                      {attr.options.map((opt) => {
                        const isActive = (attrs[attr.key] || []).includes(opt.value)
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            className={`${styles.multiselect__item} ${
                              isActive ? styles['multiselect__item--active'] : ''
                            }`}
                            onClick={() => handleMultiselectToggle(attr.key, opt.value)}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              }

              return (
                <Input
                  key={attr.key}
                  label={attr.label}
                  type={attr.type}
                  placeholder={attr.placeholder}
                  value={attrs[attr.key] || ''}
                  onChange={handleAttrChange(attr.key)}
                />
              )
            })}
          </>
        )}

        <Input
          label="Заметки"
          textarea
          placeholder="Любые заметки..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </Modal>
  )
}
