import { LuScrollText } from 'react-icons/lu';
import type { ModuleNavEntry } from '../shared/nav';
import { auditLogLinks } from './links';

export const auditLoggingNav: ModuleNavEntry[] = [
  {
    id: 'audit-logging',
    label: 'Audit Log',
    href: auditLogLinks.overview(),
    icon: LuScrollText,
    requiredAction: 'audit.view',
  },
];
