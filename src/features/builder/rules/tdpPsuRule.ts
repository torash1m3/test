import { CompatibilityRule, findByCategory, getAttr } from './types';

export const tdpPsuRule: CompatibilityRule = {
  id: 'tdp-psu-power',
  name: 'TDP компонентов ↔ Блок питания',
  check: (components) => {
    const cpus = findByCategory(components, 'cpu');
    const gpus = findByCategory(components, 'gpu');
    const psus = findByCategory(components, 'psu');

    if (psus.length === 0) {
      return { status: 'pass', message: 'БП не добавлен' };
    }

    const cpuTdp = cpus.reduce((sum, c) => sum + (Number(getAttr(c, 'tdp')) || 0), 0);
    const gpuTdp = gpus.reduce((sum, c) => sum + (Number(getAttr(c, 'tdp')) || 0), 0);
    const totalTdp = cpuTdp + gpuTdp;
    const psuWattage = Number(getAttr(psus[0], 'wattage')) || 0;

    if (totalTdp === 0 || psuWattage === 0) {
      return { status: 'warning', message: 'Не хватает данных о TDP/мощности' };
    }

    // Системный overhead: RAM, storage, fans, USB, etc.
    const SYSTEM_OVERHEAD = 100;
    const totalWithOverhead = totalTdp + SYSTEM_OVERHEAD;
    // Рекомендуемый запас — 30%
    const recommended = Math.ceil(totalWithOverhead * 1.3);

    if (psuWattage < totalWithOverhead) {
      return {
        status: 'error',
        message: `БП (${psuWattage}Вт) слабее потребления системы (~${totalWithOverhead}Вт с учётом прочих компонентов)!`,
      };
    }

    if (psuWattage < recommended) {
      return {
        status: 'warning',
        message: `БП (${psuWattage}Вт) хватает впритык. Рекомендуется ≥${recommended}Вт (${totalWithOverhead}Вт + 30% запас)`,
      };
    }

    return {
      status: 'pass',
      message: `Запас мощности ОК: ${psuWattage}Вт vs ~${totalWithOverhead}Вт потребления`,
    };
  },
};
