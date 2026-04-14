/**
 * NeoForge — Compatibility Rules Engine
 *
 * Каждое правило:
 *   - id:       уникальный идентификатор
 *   - name:     человекочитаемое название
 *   - check:    функция (components) => { status, message }
 *
 * status: 'pass' | 'warning' | 'error'
 *
 * Чтобы добавить новое правило — просто добавь объект в массив RULES.
 * Ничего больше трогать не нужно.
 */

function findByCategory(components, category) {
  return components.filter((c) => c.category === category)
}

function getAttr(component, key) {
  return component?.attrs?.[key]
}

const RULES = [
  // ─── Сокет CPU ↔ Мат. плата ───
  {
    id: 'cpu-mb-socket',
    name: 'Сокет CPU ↔ Материнская плата',
    check: (components) => {
      const cpus = findByCategory(components, 'cpu')
      const mbs = findByCategory(components, 'motherboard')

      if (cpus.length === 0 || mbs.length === 0) {
        return { status: 'pass', message: 'Не хватает данных для проверки' }
      }

      const cpuSocket = getAttr(cpus[0], 'socket')
      const mbSocket = getAttr(mbs[0], 'socket')

      if (!cpuSocket || !mbSocket) {
        return { status: 'warning', message: 'Не указан сокет у CPU или мат. платы' }
      }

      if (cpuSocket !== mbSocket) {
        return {
          status: 'error',
          message: `Сокет не совпадает: CPU (${cpuSocket}) ≠ Мат. плата (${mbSocket})`,
        }
      }

      return { status: 'pass', message: `Сокет совпадает: ${cpuSocket}` }
    },
  },

  // ─── Тип RAM ↔ Мат. плата ───
  {
    id: 'ram-mb-type',
    name: 'Тип RAM ↔ Материнская плата',
    check: (components) => {
      const rams = findByCategory(components, 'ram')
      const mbs = findByCategory(components, 'motherboard')

      if (rams.length === 0 || mbs.length === 0) {
        return { status: 'pass', message: 'Не хватает данных для проверки' }
      }

      const ramType = getAttr(rams[0], 'ramType')
      const mbRamType = getAttr(mbs[0], 'ramType')

      if (!ramType || !mbRamType) {
        return { status: 'warning', message: 'Не указан тип RAM' }
      }

      if (ramType !== mbRamType) {
        return {
          status: 'error',
          message: `Тип RAM не совпадает: RAM (${ramType}) ≠ Мат. плата (${mbRamType})`,
        }
      }

      return { status: 'pass', message: `Тип RAM совпадает: ${ramType}` }
    },
  },

  // ─── Форм-фактор мат. платы ↔ Корпус ───
  {
    id: 'mb-case-formfactor',
    name: 'Форм-фактор ↔ Корпус',
    check: (components) => {
      const mbs = findByCategory(components, 'motherboard')
      const cases = findByCategory(components, 'case')

      if (mbs.length === 0 || cases.length === 0) {
        return { status: 'pass', message: 'Не хватает данных для проверки' }
      }

      const mbFF = getAttr(mbs[0], 'formFactor')
      const caseFF = getAttr(cases[0], 'supportedFormFactors')

      if (!mbFF || !caseFF || caseFF.length === 0) {
        return { status: 'warning', message: 'Не указан форм-фактор' }
      }

      if (!caseFF.includes(mbFF)) {
        return {
          status: 'error',
          message: `Корпус не поддерживает ${mbFF}. Поддерживаются: ${caseFF.join(', ')}`,
        }
      }

      return { status: 'pass', message: `Форм-фактор ${mbFF} поддерживается` }
    },
  },

  // ─── Суммарный TDP ↔ Мощность БП ───
  {
    id: 'tdp-psu-power',
    name: 'TDP компонентов ↔ Блок питания',
    check: (components) => {
      const cpus = findByCategory(components, 'cpu')
      const gpus = findByCategory(components, 'gpu')
      const psus = findByCategory(components, 'psu')

      if (psus.length === 0) {
        return { status: 'pass', message: 'БП не добавлен' }
      }

      const cpuTdp = cpus.reduce((sum, c) => sum + (Number(getAttr(c, 'tdp')) || 0), 0)
      const gpuTdp = gpus.reduce((sum, c) => sum + (Number(getAttr(c, 'tdp')) || 0), 0)
      const totalTdp = cpuTdp + gpuTdp
      const psuWattage = Number(getAttr(psus[0], 'wattage')) || 0

      if (totalTdp === 0 || psuWattage === 0) {
        return { status: 'warning', message: 'Не хватает данных о TDP/мощности' }
      }

      // Системный overhead: RAM, storage, fans, USB, etc.
      const SYSTEM_OVERHEAD = 100
      const totalWithOverhead = totalTdp + SYSTEM_OVERHEAD
      // Рекомендуемый запас — 30%
      const recommended = Math.ceil(totalWithOverhead * 1.3)

      if (psuWattage < totalWithOverhead) {
        return {
          status: 'error',
          message: `БП (${psuWattage}Вт) слабее потребления системы (~${totalWithOverhead}Вт с учётом прочих компонентов)!`,
        }
      }

      if (psuWattage < recommended) {
        return {
          status: 'warning',
          message: `БП (${psuWattage}Вт) хватает впритык. Рекомендуется ≥${recommended}Вт (${totalWithOverhead}Вт + 30% запас)`,
        }
      }

      return {
        status: 'pass',
        message: `Запас мощности ОК: ${psuWattage}Вт vs ~${totalWithOverhead}Вт потребления`,
      }
    },
  },

  // ─── Длина GPU ↔ Корпус ───
  {
    id: 'gpu-case-length',
    name: 'Длина GPU ↔ Корпус',
    check: (components) => {
      const gpus = findByCategory(components, 'gpu')
      const cases = findByCategory(components, 'case')

      if (gpus.length === 0 || cases.length === 0) {
        return { status: 'pass', message: 'Не хватает данных для проверки' }
      }

      const gpuLength = Number(getAttr(gpus[0], 'length')) || 0
      const maxGpuLength = Number(getAttr(cases[0], 'maxGpuLength')) || 0

      if (gpuLength === 0 || maxGpuLength === 0) {
        return { status: 'warning', message: 'Не указана длина GPU или макс. длина корпуса' }
      }

      if (gpuLength > maxGpuLength) {
        return {
          status: 'error',
          message: `GPU (${gpuLength}мм) не влезет в корпус (макс. ${maxGpuLength}мм)!`,
        }
      }

      const margin = maxGpuLength - gpuLength
      if (margin < 10) {
        return {
          status: 'warning',
          message: `GPU (${gpuLength}мм) влезает в корпус (${maxGpuLength}мм), но запас всего ${margin}мм — впритык`,
        }
      }

      return {
        status: 'pass',
        message: `GPU (${gpuLength}мм) влезает: запас ${margin}мм`,
      }
    },
  },

  // ─── Охлаждение ↔ TDP процессора ───
  {
    id: 'cooling-cpu-tdp',
    name: 'Охлаждение ↔ TDP процессора',
    check: (components) => {
      const cpus = findByCategory(components, 'cpu')
      const coolers = findByCategory(components, 'cooling')

      if (cpus.length === 0 || coolers.length === 0) {
        return { status: 'pass', message: 'Не хватает данных для проверки' }
      }

      const cpuTdp = Number(getAttr(cpus[0], 'tdp')) || 0
      const coolerTdp = Number(getAttr(coolers[0], 'tdpSupport')) || 0

      if (cpuTdp === 0 || coolerTdp === 0) {
        return { status: 'warning', message: 'Не указан TDP у процессора или кулера' }
      }

      if (coolerTdp < cpuTdp) {
        return {
          status: 'error',
          message: `Кулер (${coolerTdp}Вт) не справится с процессором (${cpuTdp}Вт TDP)!`,
        }
      }

      const margin = Math.round((coolerTdp / cpuTdp - 1) * 100)
      if (margin < 20) {
        return {
          status: 'warning',
          message: `Кулер (${coolerTdp}Вт) справится, но запас всего ${margin}% — рекомендуется ≥20%`,
        }
      }

      return {
        status: 'pass',
        message: `Кулер ОК: ${coolerTdp}Вт vs ${cpuTdp}Вт CPU (запас ${margin}%)`,
      }
    },
  },

  // ─── Дубликаты критичных категорий ───
  {
    id: 'duplicates',
    name: 'Дубликаты компонентов',
    check: (components) => {
      const singleCategories = ['cpu', 'motherboard', 'psu', 'case']
      const issues = []

      for (const cat of singleCategories) {
        const count = findByCategory(components, cat).length
        if (count > 1) {
          issues.push(`${cat.toUpperCase()}: ${count} шт.`)
        }
      }

      if (issues.length > 0) {
        return {
          status: 'warning',
          message: `Несколько компонентов в одиночных категориях: ${issues.join(', ')}`,
        }
      }

      return { status: 'pass', message: 'Нет дубликатов' }
    },
  },
]

/**
 * Запустить все проверки совместимости.
 * @param {Array} components — массив компонентов сборки
 * @returns {Array} — массив результатов { id, name, status, message }
 */
export function runCompatibilityChecks(components) {
  if (!components || components.length === 0) return []

  return RULES.map((rule) => {
    try {
      const result = rule.check(components)
      return {
        id: rule.id,
        name: rule.name,
        ...result,
      }
    } catch {
      return {
        id: rule.id,
        name: rule.name,
        status: 'warning',
        message: 'Ошибка проверки правила',
      }
    }
  })
}

/**
 * Быстрая проверка — есть ли критические ошибки
 */
export function hasErrors(results) {
  return results.some((r) => r.status === 'error')
}

/**
 * Количество предупреждений
 */
export function countWarnings(results) {
  return results.filter((r) => r.status === 'warning').length
}
