import { CompatibilityRule, findByCategory, getAttr } from './types';

export const coolingTdpRule: CompatibilityRule = {
  id: 'cooling-cpu-tdp',
  name: 'Охлаждение ↔ TDP процессора',
  check: (components) => {
    const cpus = findByCategory(components, 'cpu');
    const coolers = findByCategory(components, 'cooling');

    if (cpus.length === 0 || coolers.length === 0) {
      return { status: 'pass', message: 'Не хватает данных для проверки' };
    }

    const cpuTdp = Number(getAttr(cpus[0], 'tdp')) || 0;
    const coolerTdp = Number(getAttr(coolers[0], 'tdpSupport')) || 0;

    if (cpuTdp === 0 || coolerTdp === 0) {
      return { status: 'warning', message: 'Не указан TDP у процессора или кулера' };
    }

    if (coolerTdp < cpuTdp) {
      return {
        status: 'error',
        message: `Кулер (${coolerTdp}Вт) не справится с процессором (${cpuTdp}Вт TDP)!`,
      };
    }

    const margin = Math.round((coolerTdp / cpuTdp - 1) * 100);
    if (margin < 20) {
      return {
        status: 'warning',
        message: `Кулер (${coolerTdp}Вт) справится, но запас всего ${margin}% — рекомендуется ≥20%`,
      };
    }

    return {
      status: 'pass',
      message: `Кулер ОК: ${coolerTdp}Вт vs ${cpuTdp}Вт CPU (запас ${margin}%)`,
    };
  },
};
