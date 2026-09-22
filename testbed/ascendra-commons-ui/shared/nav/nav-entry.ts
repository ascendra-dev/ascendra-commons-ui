import type { ComponentType } from 'react';

export interface ModuleNavIconProps {
  className?: string;
}

/**
 * One entry in a module's nav.ts — imported directly by the observability
 * shell's layout.tsx (packages/observability), never hand-aggregated by a
 * vertical (see packages/README.md). `id` must be unique across every
 * shipped module.
 */
export interface ModuleNavEntry {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<ModuleNavIconProps>;
  /** Dot-namespaced backend action string (e.g. 'audit.view') gating this
   * entry's visibility — checked against the current user's allowedActions
   * by the shell layout. A user without it never sees the link at all. */
  requiredAction: string;
}
