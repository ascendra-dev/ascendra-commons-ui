import { LuGauge, LuSend } from 'react-icons/lu';
import type { ModuleNavEntry } from '../shared/nav';
import { notificationLinks } from './links';

/** The notification console's own sidebar — every entry needs `notification.view`. */
export const notificationNav: ModuleNavEntry[] = [
  { id: 'notification-overview', label: 'Overview', href: notificationLinks.overview(), icon: LuGauge, requiredAction: 'notification.view' },
  { id: 'notification-deliveries', label: 'Deliveries', href: notificationLinks.deliveries(), icon: LuSend, requiredAction: 'notification.view' },
];
