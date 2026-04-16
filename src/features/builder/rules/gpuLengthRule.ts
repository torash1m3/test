import { CompatibilityRule, findByCategory, getAttr } from './types';

export const gpuLengthRule: CompatibilityRule = {
  id: 'gpu-case-length',
  name: 'Длина GPU ↔ Корпус',
  check: (components) => {
    const gpus = findByCategory(components, 'gpu');
    const cases = findByCategory(components, 'case');

    if (gpus.length === 0 || cases.length === 0) {
      return { status: 'pass', message: 'Не хватает данных для проверки' };
    }

    const gpuLength = Number(getAttr(gpus[0], 'length')) || 0;
    const maxGpuLength = Number(getAttr(cases[0], 'maxGpuLength')) || 0;

    if (gpuLength === 0 || maxGpuLength === 0) {
      return { status: 'warning', message: 'Не указана длина GPU или макс. длина корпуса' };
    }

    if (gpuLength > maxGpuLength) {
      return {
        status: 'error',
        message: `GPU (${gpuLength}мм) не влезет в корпус (макс. ${maxGpuLength}мм)!`,
      };
    }

    const margin = maxGpuLength - gpuLength;
    if (margin < 10) {
      return {
        status: 'warning',
        message: `GPU (${gpuLength}мм) влезает в корпус (${maxGpuLength}мм), но запас всего ${margin}мм — впритык`,
      };
    }

    return {
      status: 'pass',
      message: `GPU (${gpuLength}мм) влезает: запас ${margin}мм`,
    };
  },
};
