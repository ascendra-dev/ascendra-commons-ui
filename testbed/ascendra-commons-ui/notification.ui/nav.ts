import { LuBan, LuBellRing, LuGauge, LuInbox, LuKeyRound, LuLayers, LuSend } from 'react-icons/lu';
import type { ModuleNavEntry } from '../shared/nav';
import { notificationLinks } from './links';

/** The notification console's own sidebar — every entry needs `notification.view`. */
export const notificationNav: ModuleNavEntry[] = [
  { id: 'notification-overview', label: 'Overview', href: notificationLinks.overview(), icon: LuGauge, requiredAction: 'notification.view' },
  { id: 'notification-types', label: 'Notification types', href: notificationLinks.types(), icon: LuLayers, requiredAction: 'notification.view' },
  { id: 'notification-deliveries', label: 'Deliveries', href: notificationLinks.deliveries(), icon: LuSend, requiredAction: 'notification.view' },
  { id: 'notification-accounts', label: 'Provider accounts', href: notificationLinks.accounts(), icon: LuKeyRound, requiredAction: 'notification.view' },
  { id: 'notification-suppressions', label: 'Suppressions', href: notificationLinks.suppressions(), icon: LuBan, requiredAction: 'notification.view' },
];

/** Everyone's — any signed-in user's own inbox and what reaches them (`requiredAction: ''` — always shown). */
export const notificationSelfNav: ModuleNavEntry[] = [
  { id: 'notification-inbox', label: 'My inbox', href: notificationLinks.inbox(), icon: LuInbox, requiredAction: '' },
  { id: 'notification-preferences', label: 'My notifications', href: notificationLinks.preferences(), icon: LuBellRing, requiredAction: '' },
];
