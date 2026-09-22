import { LuScrollText } from 'react-icons/lu';
import type { ModuleNavEntry } from '../shared/nav';

export const auditLoggingNav: ModuleNavEntry[] = [
  {
    id: 'audit-logging',
    label: 'Audit Log',
    href: '/observability/audit',
    icon: LuScrollText,
    requiredAction: 'audit.view',
  },
];
