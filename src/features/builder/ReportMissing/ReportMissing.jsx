import { useState } from 'react'
import { CircleAlert, CheckCircle } from 'lucide-react'
import { Button, Input, Modal, Select } from '@/shared/ui'
import { CATEGORY_SCHEMAS } from '@/features/builder/schemas'
import styles from './ReportMissing.module.css'

const categoryOptions = Object.entries(CATEGORY_SCHEMAS).map(([key, val]) => ({
  value: key,
  label: val.label,
}))

/**
 * Заглушка — сохраняет репорт в localStorage.
 * Когда подключим Firebase, заменим на запись в Firestore.
 */
function saveReport(report) {
  const reports = JSON.parse(localStorage.getItem('neoforge-reports') || '[]')
  reports.push({
    ...report,
    id: crypto.randomUUID(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  })
  localStorage.setItem('neoforge-reports', JSON.stringify(reports))
}

export default function ReportMissing() {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({
    componentName: '',
    category: 'cpu',
    description: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.componentName.trim()) return

    saveReport(form)
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
            />
          </form>
        )}
      </Modal>
    </>
  )
}
