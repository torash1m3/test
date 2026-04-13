import { useMemo } from 'react'
import { ShieldCheck, CircleCheck, AlertTriangle, CircleX } from 'lucide-react'
import { runCompatibilityChecks, hasErrors, countWarnings } from '@/features/builder/compatibility'
import styles from './CompatibilityPanel.module.css'

const STATUS_ICONS = {
  pass: CircleCheck,
  warning: AlertTriangle,
  error: CircleX,
}

export default function CompatibilityPanel({ components }) {
  const results = useMemo(
    () => runCompatibilityChecks(components),
    [components]
  )

  if (results.length === 0) return null

  const errors = hasErrors(results)
  const warnings = countWarnings(results)
  const activeResults = results.filter((r) => r.status !== 'pass')
  const passCount = results.filter((r) => r.status === 'pass').length

  let summaryClass = styles['summary--ok']
  let summaryText = `Всё совместимо (${passCount} проверок)`
  if (errors) {
    summaryClass = styles['summary--critical']
    summaryText = `Обнаружены несовместимости!`
  } else if (warnings > 0) {
    summaryClass = styles['summary--issues']
    summaryText = `${warnings} предупреждений`
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panel__title}>
        <ShieldCheck size={16} />
        Совместимость
      </div>

      {/* Summary */}
      <div className={`${styles.summary} ${summaryClass}`}>
        {summaryText}
      </div>

      {/* Active issues (errors + warnings) */}
      {activeResults.map((result) => {
        const Icon = STATUS_ICONS[result.status]
        return (
          <div
            key={result.id}
            className={`${styles.rule} ${styles[`rule--${result.status}`]}`}
          >
            <div className={`${styles.rule__icon} ${styles[`rule__icon--${result.status}`]}`}>
              <Icon size={14} />
            </div>
            <div className={styles.rule__content}>
              <div className={styles.rule__name}>{result.name}</div>
              <div className={styles.rule__message}>{result.message}</div>
            </div>
          </div>
        )
      })}

      {/* Passed checks (collapsed) */}
      {activeResults.length > 0 && passCount > 0 && (
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          + {passCount} проверок пройдено
        </div>
      )}
    </div>
  )
}
