import { CompatibilityRule, findByCategory, getAttr } from './types';

export const socketRule: CompatibilityRule = {
  id: 'cpu-mb-socket',
  name: 'Сокет CPU ↔ Материнская плата',
  check: (components) => {
    const cpus = findByCategory(components, 'cpu');
    const mbs = findByCategory(components, 'motherboard');

    if (cpus.length === 0 || mbs.length === 0) {
      return { status: 'pass', message: 'Не хватает данных для проверки' };
    }

    const cpuSocket = getAttr(cpus[0], 'socket');
    const mbSocket = getAttr(mbs[0], 'socket');

    if (!cpuSocket || !mbSocket) {
      return { status: 'warning', message: 'Не указан сокет у CPU или мат. платы' };
    }

    if (cpuSocket !== mbSocket) {
      return {
        status: 'error',
        message: `Сокет не совпадает: CPU (${cpuSocket}) ≠ Мат. плата (${mbSocket})`,
      };
    }

    return { status: 'pass', message: `Сокет совпадает: ${cpuSocket}` };
  },
};
