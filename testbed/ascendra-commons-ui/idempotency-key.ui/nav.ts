import { LuKeyRound } from 'react-icons/lu';
import type { ModuleNavEntry } from '../shared/nav';
import { idempotencyLinks } from './links';

export const idempotencyNav: ModuleNavEntry[] = [
  {
    id: 'idempotency',
    label: 'Idempotency',
    href: idempotencyLinks.overview(),
    icon: LuKeyRound,
    requiredAction: 'idempotency.view',
  },
];
