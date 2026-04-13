/**
 * NeoForge — Component Category Schemas
 *
 * Определяет какие атрибуты совместимости нужны для каждой категории.
 * Каждый атрибут имеет:
 *   - key:         ключ в объекте attrs компонента
 *   - label:       название для UI
 *   - type:        'select' | 'number' | 'text'
 *   - options:     массив вариантов (для select)
 *   - placeholder: подсказка
 *   - required:    обязательное ли поле для проверки совместимости
 *
 * Расширяй свободно — добавляй новые категории и атрибуты.
 */

export const CATEGORY_SCHEMAS = {
  cpu: {
    label: 'Процессор',
    icon: 'cpu',
    attrs: [
      {
        key: 'socket',
        label: 'Сокет',
        type: 'select',
        options: [
          { value: 'AM5', label: 'AM5' },
          { value: 'AM4', label: 'AM4' },
          { value: 'LGA1700', label: 'LGA 1700' },
          { value: 'LGA1851', label: 'LGA 1851' },
          { value: 'LGA1200', label: 'LGA 1200' },
        ],
        required: true,
      },
      {
        key: 'tdp',
        label: 'TDP (Вт)',
        type: 'number',
        placeholder: '105',
        required: true,
      },
    ],
  },

  gpu: {
    label: 'Видеокарта',
    icon: 'monitor',
    attrs: [
      {
        key: 'tdp',
        label: 'TDP (Вт)',
        type: 'number',
        placeholder: '250',
        required: true,
      },
      {
        key: 'length',
        label: 'Длина (мм)',
        type: 'number',
        placeholder: '320',
        required: false,
      },
    ],
  },

  motherboard: {
    label: 'Мат. плата',
    icon: 'circuit-board',
    attrs: [
      {
        key: 'socket',
        label: 'Сокет',
        type: 'select',
        options: [
          { value: 'AM5', label: 'AM5' },
          { value: 'AM4', label: 'AM4' },
          { value: 'LGA1700', label: 'LGA 1700' },
          { value: 'LGA1851', label: 'LGA 1851' },
          { value: 'LGA1200', label: 'LGA 1200' },
        ],
        required: true,
      },
      {
        key: 'formFactor',
        label: 'Форм-фактор',
        type: 'select',
        options: [
          { value: 'ATX', label: 'ATX' },
          { value: 'mATX', label: 'Micro-ATX' },
          { value: 'ITX', label: 'Mini-ITX' },
          { value: 'EATX', label: 'E-ATX' },
        ],
        required: true,
      },
      {
        key: 'ramType',
        label: 'Тип RAM',
        type: 'select',
        options: [
          { value: 'DDR5', label: 'DDR5' },
          { value: 'DDR4', label: 'DDR4' },
        ],
        required: true,
      },
    ],
  },

  ram: {
    label: 'Оперативная память',
    icon: 'memory-stick',
    attrs: [
      {
        key: 'ramType',
        label: 'Тип',
        type: 'select',
        options: [
          { value: 'DDR5', label: 'DDR5' },
          { value: 'DDR4', label: 'DDR4' },
        ],
        required: true,
      },
      {
        key: 'capacity',
        label: 'Объём (ГБ)',
        type: 'number',
        placeholder: '16',
        required: false,
      },
    ],
  },

  storage: {
    label: 'Накопитель',
    icon: 'hard-drive',
    attrs: [
      {
        key: 'storageType',
        label: 'Тип',
        type: 'select',
        options: [
          { value: 'NVMe', label: 'NVMe SSD' },
          { value: 'SATA_SSD', label: 'SATA SSD' },
          { value: 'HDD', label: 'HDD' },
        ],
        required: false,
      },
      {
        key: 'capacity',
        label: 'Объём (ГБ)',
        type: 'number',
        placeholder: '1000',
        required: false,
      },
    ],
  },

  psu: {
    label: 'Блок питания',
    icon: 'zap',
    attrs: [
      {
        key: 'wattage',
        label: 'Мощность (Вт)',
        type: 'number',
        placeholder: '750',
        required: true,
      },
      {
        key: 'certification',
        label: 'Сертификат',
        type: 'select',
        options: [
          { value: 'none', label: 'Нет' },
          { value: '80plus', label: '80+ White' },
          { value: '80plus_bronze', label: '80+ Bronze' },
          { value: '80plus_gold', label: '80+ Gold' },
          { value: '80plus_platinum', label: '80+ Platinum' },
        ],
        required: false,
      },
    ],
  },

  case: {
    label: 'Корпус',
    icon: 'box',
    attrs: [
      {
        key: 'supportedFormFactors',
        label: 'Поддерживаемые форм-факторы',
        type: 'multiselect',
        options: [
          { value: 'ATX', label: 'ATX' },
          { value: 'mATX', label: 'Micro-ATX' },
          { value: 'ITX', label: 'Mini-ITX' },
          { value: 'EATX', label: 'E-ATX' },
        ],
        required: true,
      },
      {
        key: 'maxGpuLength',
        label: 'Макс. длина GPU (мм)',
        type: 'number',
        placeholder: '380',
        required: false,
      },
    ],
  },

  cooling: {
    label: 'Охлаждение',
    icon: 'fan',
    attrs: [
      {
        key: 'coolingType',
        label: 'Тип',
        type: 'select',
        options: [
          { value: 'air', label: 'Воздушное (башня)' },
          { value: 'aio_120', label: 'СВО 120мм' },
          { value: 'aio_240', label: 'СВО 240мм' },
          { value: 'aio_360', label: 'СВО 360мм' },
          { value: 'custom', label: 'Кастомная СВО' },
        ],
        required: false,
      },
      {
        key: 'tdpSupport',
        label: 'Макс TDP (Вт)',
        type: 'number',
        placeholder: '200',
        required: false,
      },
    ],
  },

  peripherals: {
    label: 'Периферия',
    icon: 'mouse',
    attrs: [],
  },

  other: {
    label: 'Другое',
    icon: 'package',
    attrs: [],
  },
}

/**
 * Получить атрибуты для категории
 */
export function getSchemaForCategory(category) {
  return CATEGORY_SCHEMAS[category] || { label: category, attrs: [] }
}

/**
 * Получить пустой объект attrs для категории
 */
export function getEmptyAttrs(category) {
  const schema = getSchemaForCategory(category)
  const attrs = {}
  for (const attr of schema.attrs) {
    if (attr.type === 'multiselect') {
      attrs[attr.key] = []
    } else if (attr.type === 'number') {
      attrs[attr.key] = ''
    } else {
      attrs[attr.key] = ''
    }
  }
  return attrs
}
