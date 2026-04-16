export type RuleStatus = 'pass' | 'warning' | 'error';

export interface RuleResult {
  id: string;
  name: string;
  status: RuleStatus;
  message: string;
}

// We reuse the basic Component type from builderStore
import type { Component } from '@/stores/builderStore';

export interface CompatibilityRule {
  id: string;
  name: string;
  check: (components: Component[]) => Omit<RuleResult, 'id' | 'name'>;
}

export function findByCategory(components: Component[], category: string): Component[] {
  return components.filter((c) => c.category === category);
}

export function getAttr(component: Component | undefined, key: string): any {
  return component?.attrs?.[key];
}
