import { useState } from 'react'
import { CircleAlert, CheckCircle } from 'lucide-react'
import { Button, Input, Modal, Select } from '@/shared/ui'
import { CATEGORY_SCHEMAS } from '@/features/builder/schemas'
import styles from './ReportMissing.module.css'

const categoryOptions = Object.entries(CATEGORY_SCHEMAS).map(([key, val]) => ({
  value: key,
  label: val.label,
}))

import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import useAuthStore from '@/stores/authStore'

/**
 * Сохранить репорт в Firestore (/reports)
 */
async function saveReport(report, user) {
  try {
    await addDoc(collection(db, 'reports'), {
      ...report,
      status: 'pending',
      authorId: user?.uid || 'anonymous',
      authorName: user?.displayName || user?.email || 'Гость',
      createdAt: serverTimestamp(),
    })
  } catch (err) {
    console.error('Ошибка отправки репорта:', err)
  }
}

export default function ReportMissing() {
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({
    componentName: '',
    category: 'cpu',
    description: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.componentName.trim()) return

    await saveReport(form, user)
    setSent(true)

    setTimeout(() => {
      setSent(false)
      setOpen(false)
      setForm({ componentName: '', category: 'cpu', description: '' })
    }, 2000)
  }

  return (
    <>
      <button
        className={styles['report-btn']}
        onClick={() => setOpen(true)}
      >
        <CircleAlert size={14} />
        Не нашёл комплектующую? Сообщи нам
      </button>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setSent(false) }}
        title="Нет нужной комплектующей"
        size="sm"
        footer={
          !sent && (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!form.componentName.trim()}
              >
                Отправить
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
