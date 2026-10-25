import { redirect } from 'next/navigation';
import { notificationLinks } from '@/ascendra-commons-ui/notification.ui/links';

/** Until the Overview lands, the console opens on its log. */
export default function NotificationsPage() {
  redirect(notificationLinks.deliveries());
}
