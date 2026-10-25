import type { Delivery, DeliveryStatus, NotificationChannel } from './api/notification-api.types';

const CHANNEL_LABELS: Record<NotificationChannel, string> = { email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp', in_app: 'In-app' };

/** `Email`, `SMS`, `WhatsApp`, `In-app`. */
export const channelLabel = (channel: NotificationChannel) => CHANNEL_LABELS[channel];

export const NOTIFICATION_CHANNELS: NotificationChannel[] = ['email', 'sms', 'whatsapp', 'in_app'];

/** Its badge colour: reached green, failed and bounced red, skipped grey — and sent (no callback yet) blue. */
export function deliveryStatusVariant(status: DeliveryStatus): 'green' | 'red' | 'secondary' | 'blue' {
  if (status === 'delivered') return 'green';
  if (status === 'failed' || status === 'bounced') return 'red';
  return status === 'skipped' ? 'secondary' : 'blue';
}

/** The reason codes the module records, in plain words — what the status badge's neighbour says. */
const REASONS: Record<string, string> = {
  suppressed: 'suppressed — it bounced before',
  opted_out: 'opted out',
  template_not_found: 'no template',
  no_address_available: 'no address on file',
  provider_rejected: 'provider rejected the address',
  provider_auth_failed: 'provider rejected the key',
  provider_timeout: 'provider timed out',
  provider_error: 'provider error',
  no_credential: 'no provider account',
};

/** A reason split into its code and the provider's own detail: `provider_timeout: no answer within 10s`. */
export function splitReason(reason: string | null): { code: string | null; detail: string | null } {
  if (!reason) return { code: null, detail: null };
  const at = reason.indexOf(':');
  // A bounce's reason is the provider's detail alone ("550 5.1.1 mailbox unavailable").
  if (at === -1) return REASONS[reason] ? { code: reason, detail: null } : { code: null, detail: reason };
  return { code: reason.slice(0, at), detail: reason.slice(at + 1).trim() };
}

/** A failure that may pass on its own — a timeout, a provider hiccup; the rest (config, the address) fail again. */
export const isTransient = (reason: string | null) => ['provider_timeout', 'provider_error'].includes(splitReason(reason).code ?? '');

/** What the log shows beside the status: plain words for a known code, else the provider's detail as given. */
export function reasonLabel(reason: string | null): string | null {
  const { code, detail } = splitReason(reason);
  if (code && REASONS[code]) return REASONS[code];
  return detail ?? code;
}

/** A guest — `raw:<channel>`: the address was used once and never stored. */
export const isGuest = (d: Pick<Delivery, 'recipientRef'>) => !d.recipientRef.startsWith('user:');

/** A user recipient's id — `user:<id>` → `<id>`; null for a guest. */
export const recipientUserId = (d: Pick<Delivery, 'recipientRef'>) => (isGuest(d) ? null : d.recipientRef.slice('user:'.length));

/** Who it went to, as the log names them: the user's name (or id), or "Guest". */
export const recipientLabel = (d: Pick<Delivery, 'recipientRef' | 'recipientName'>) =>
  isGuest(d) ? 'Guest' : (d.recipientName ?? recipientUserId(d)!);

/** "Everything to this recipient" — the Advanced Filter's params: a user by id; a guest by the hashed key. */
export function recipientFilter(d: Pick<Delivery, 'recipientRef' | 'recipientKey'>): Record<string, string> | null {
  const userId = recipientUserId(d);
  if (userId) return { user: userId };
  return d.recipientKey ? { recipientKey: d.recipientKey } : null;
}

/**
 * Why a delivery can't be retried — null when it can. The API's own rules: failed or bounced, a real send to a user
 * whose variables are still stored, not retried already.
 */
export function retryBlocker(d: Delivery): string | null {
  if (d.status !== 'failed' && d.status !== 'bounced') return null;
  if (d.retriedBy) return null;
  if (d.isTest) return 'A test send is not retried — send another test.';
  if (isGuest(d)) return "A guest's delivery can't be retried — the address isn't stored. Notify them again from where they were notified.";
  if (!d.hasContent) return 'Its variables are no longer kept, so it can’t be rebuilt.';
  return null;
}

/** Retryable by the API's rules (the viewer still needs `notification.retry`). */
export const canRetry = (d: Delivery) =>
  (d.status === 'failed' || d.status === 'bounced') && !d.retriedBy && retryBlocker(d) === null;
