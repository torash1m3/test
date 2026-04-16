/**
 * NeoForge — Compatibility Rules Engine
 *
 * Каждое правило:
 *   - id:       уникальный идентификатор
 *   - name:     человекочитаемое название
 *   - check:    функция (components) => { status, message }
 *
 * status: 'pass' | 'warning' | 'error'
 */

import type { Component } from '@/stores/builderStore';
import type { CompatibilityRule, RuleResult } from './rules/types';

import { socketRule } from './rules/socketRule';
import { ramTypeRule } from './rules/ramTypeRule';
import { formFactorRule } from './rules/formFactorRule';
import { tdpPsuRule } from './rules/tdpPsuRule';
import { gpuLengthRule } from './rules/gpuLengthRule';
import { coolingTdpRule } from './rules/coolingTdpRule';
import { duplicatesRule } from './rules/duplicatesRule';

export const RULES: CompatibilityRule[] = [
  socketRule,
  ramTypeRule,
  formFactorRule,
  tdpPsuRule,
  gpuLengthRule,
  coolingTdpRule,
  duplicatesRule,
];

/**
 * Запустить все проверки совместимости.
 * @param components — массив компонентов сборки
 * @returns массив результатов { id, name, status, message }
 */
export function runCompatibilityChecks(components: Component[]): RuleResult[] {
  if (!components || components.length === 0) return [];

  return RULES.map((rule) => {
    try {
      const result = rule.check(components);
      return {
        id: rule.id,
        name: rule.name,
        ...result,
      };
    } catch {
      return {
        id: rule.id,
        name: rule.name,
        status: 'warning',
        message: 'Ошибка проверки правила',
      };
    }
  });
}

/**
 * Быстрая проверка — есть ли критические ошибки
 */
export function hasErrors(results: RuleResult[]): boolean {
  return results.some((r) => r.status === 'error');
}

/**
 * Количество предупреждений
 */
export function countWarnings(results: RuleResult[]): number {
  return results.filter((r) => r.status === 'warning').length;
}
