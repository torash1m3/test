import { CompatibilityRule, findByCategory, getAttr } from './types';

export const ramTypeRule: CompatibilityRule = {
  id: 'ram-mb-type',
  name: 'Тип RAM ↔ Материнская плата',
  check: (components) => {
    const rams = findByCategory(components, 'ram');
    const mbs = findByCategory(components, 'motherboard');

    if (rams.length === 0 || mbs.length === 0) {
      return { status: 'pass', message: 'Не хватает данных для проверки' };
    }

    const ramType = getAttr(rams[0], 'ramType');
    const mbRamType = getAttr(mbs[0], 'ramType');

    if (!ramType || !mbRamType) {
      return { status: 'warning', message: 'Не указан тип RAM' };
    }

    if (ramType !== mbRamType) {
      return {
        status: 'error',
        message: `Тип RAM не совпадает: RAM (${ramType}) ≠ Мат. плата (${mbRamType})`,
      };
    }

    return { status: 'pass', message: `Тип RAM совпадает: ${ramType}` };
  },
};
