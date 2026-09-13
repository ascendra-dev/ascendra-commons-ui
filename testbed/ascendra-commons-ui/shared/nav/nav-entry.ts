import type { ComponentType } from 'react';

export interface ModuleNavIconProps {
  className?: string;
}

/**
 * One entry in a module's nav.ts — the only thing a vertical's dashboard is
 * allowed to import to build nav (see packages/README.md). `id` must be
 * unique across every shipped module.
 */
export interface ModuleNavEntry {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<ModuleNavIconProps>;
}
