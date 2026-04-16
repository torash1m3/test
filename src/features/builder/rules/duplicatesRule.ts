import { CompatibilityRule, findByCategory } from './types';

export const duplicatesRule: CompatibilityRule = {
  id: 'duplicates',
  name: 'Дубликаты компонентов',
  check: (components) => {
    const singleCategories = ['cpu', 'motherboard', 'psu', 'case'];
    const issues: string[] = [];

    for (const cat of singleCategories) {
      const count = findByCategory(components, cat).length;
      if (count > 1) {
        issues.push(`${cat.toUpperCase()}: ${count} шт.`);
      }
    }

    if (issues.length > 0) {
      return {
        status: 'warning',
        message: `Несколько компонентов в одиночных категориях: ${issues.join(', ')}`,
      };
    }

    return { status: 'pass', message: 'Нет дубликатов' };
  },
};
