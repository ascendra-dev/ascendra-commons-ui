import { LuGauge } from 'react-icons/lu';
import type { ModuleNavEntry } from '../shared/nav';
import { rateLimitLinks } from './links';

export const rateLimitingNav: ModuleNavEntry[] = [
  {
    id: 'rate-limiting',
    label: 'Rate Limiting',
    href: rateLimitLinks.overview(),
    icon: LuGauge,
    requiredAction: 'rate-limit.view',
  },
];
