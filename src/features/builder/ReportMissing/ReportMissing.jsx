import { useState } from 'react'
import { CircleAlert, CheckCircle } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { Button, Input, Modal, Select } from '@/shared/ui'
import { CATEGORY_SCHEMAS } from '@/features/builder/schemas'
import { db } from '@/lib/firebase'
import useAuthStore from '@/stores/authStore'
import styles from './ReportMissing.module.css'

const categoryOptions = Object.entries(CATEGORY_SCHEMAS).map(([key, val]) => ({
  value: key,
  label: val.label,
}))

/**
 * Сохранить репорт в Firestore (/reports)
 */
async function saveReport(report, user) {
  if (!user) {
    throw new Error('Требуется авторизация')
  }

  await addDoc(collection(db, 'reports'), {
    ...report,
    status: 'pending',
    authorId: user.uid,
    authorName: user.displayName || user.email || 'Пользователь',
    createdAt: serverTimestamp(),
  })
}

export default function ReportMissing() {
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    componentName: '',
    category: 'cpu',
    description: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.componentName.trim()) return

    setSending(true)
    setError('')

    try {
      await saveReport(form, user)
      setSent(true)

      setTimeout(() => {
        setSent(false)
        setOpen(false)
        setForm({ componentName: '', category: 'cpu', description: '' })
      }, 2000)
    } catch {
      setError('Не удалось отправить репорт. Проверь сеть и попробуй ещё раз.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        className={styles['report-btn']}
        onClick={() => { setOpen(true); setError('') }}
      >
        <CircleAlert size={14} />
        Не нашёл комплектующую? Сообщи нам
      </button>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setSent(false); setError('') }}
        title="Нет нужной комплектующей"
        size="sm"
        footer={
          !sent && (
            <>
              <Button variant="ghost" onClick={() => { setOpen(false); setError('') }}>
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!form.componentName.trim() || sending}
              >
                {sending ? 'Отправка...' : 'Отправить'}
              </Button>
            </>
          )
        }
      >
        {sent ? (
          <div className={styles['report-success']}>
            <CheckCircle size={32} className={styles['report-success__icon']} />
            <div className={styles['report-success__title']}>Спасибо!</div>
            <div className={styles['report-success__desc']}>
              Запрос сохранён. Когда подключим ИИ-агент — он обработает его автоматически.
            </div>
          </div>
        ) : (
          <form className={styles['report-form']} onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.24)',
                color: '#fca5a5',
                fontSize: 'var(--font-size-sm)',
              }}>
                {error}
              </div>
            )}
            <Input
              label="Какой комплектующей не хватает?"
              placeholder="AMD Ryzen 9 9700X"
              value={form.componentName}
              onChange={(e) => setForm((p) => ({ ...p, componentName: e.target.value }))}
              required
              maxLength={100}
            />
            <Select
              label="Категория"
              options={categoryOptions}
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            />
            <Input
              label="Дополнительно (необязательно)"
              textarea
              placeholder="Ссылка на характеристики, комментарий..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              maxLength={1000}
            />
          </form>
        )}
      </Modal>
    </>
  )
}
