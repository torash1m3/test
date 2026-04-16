import { CompatibilityRule, findByCategory, getAttr } from './types';

export const formFactorRule: CompatibilityRule = {
  id: 'mb-case-formfactor',
  name: 'Форм-фактор ↔ Корпус',
  check: (components) => {
    const mbs = findByCategory(components, 'motherboard');
    const cases = findByCategory(components, 'case');

    if (mbs.length === 0 || cases.length === 0) {
      return { status: 'pass', message: 'Не хватает данных для проверки' };
    }

    const mbFF = getAttr(mbs[0], 'formFactor');
    const caseFF = getAttr(cases[0], 'supportedFormFactors');

    if (!mbFF || !caseFF || caseFF.length === 0) {
      return { status: 'warning', message: 'Не указан форм-фактор' };
    }

    if (!caseFF.includes(mbFF)) {
      return {
        status: 'error',
        message: `Корпус не поддерживает ${mbFF}. Поддерживаются: ${caseFF.join(', ')}`,
      };
    }

    return { status: 'pass', message: `Форм-фактор ${mbFF} поддерживается` };
  },
};
