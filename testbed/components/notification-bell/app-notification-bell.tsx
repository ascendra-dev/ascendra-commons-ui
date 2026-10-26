'use client';

import { NotificationBell } from '@/ascendra-commons-ui/notification.ui/bell';
import { useSession } from '@/app/observability/auth/use-session';

/** notification.ui's bell in the testbed's top bar — shown to anyone signed in (a real app passes its own session). */
export function AppNotificationBell() {
  const { data: session } = useSession();
  return <NotificationBell enabled={!!session?.actor} />;
}
