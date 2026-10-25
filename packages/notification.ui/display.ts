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

/** How a reason reads as a heading — the overview's "why sends failed". */
const REASON_TITLES: Record<string, string> = {
  suppressed: 'Suppressed — the address bounced before',
  opted_out: 'Opted out by the user',
  template_not_found: 'No template for the channel',
  no_address_available: 'No phone or email on file',
  provider_rejected: 'Provider rejected the address',
  provider_auth_failed: 'Provider rejected the key',
  provider_timeout: 'Provider timed out',
  provider_error: 'Provider error',
  no_credential: 'No provider account',
  bounced: 'Bounced',
};

/** What a reason says about the fix: skipped on purpose, the configuration, the recipient, or a passing failure. */
export type ReasonKind = 'skipped' | 'config' | 'recipient' | 'transient';

const REASON_KINDS: Record<string, ReasonKind> = {
  suppressed: 'skipped',
  opted_out: 'skipped',
  template_not_found: 'config',
  provider_auth_failed: 'config',
  no_credential: 'config',
  no_address_available: 'recipient',
  provider_rejected: 'recipient',
  bounced: 'recipient',
  provider_timeout: 'transient',
  provider_error: 'transient',
};

export const REASON_KIND_BADGE: Record<ReasonKind, { label: string; variant: 'secondary' | 'orange' | 'red' | 'blue' }> = {
  skipped: { label: 'skipped', variant: 'secondary' },
  config: { label: 'config', variant: 'orange' },
  recipient: { label: 'recipient', variant: 'red' },
  transient: { label: 'transient — retryable', variant: 'blue' },
};

/** A reason code (`template_not_found`) as a heading, and what kind of fix it needs. */
export const reasonTitle = (code: string) => REASON_TITLES[code] ?? code.replaceAll('_', ' ');
export const reasonKind = (code: string): ReasonKind | null => REASON_KINDS[code] ?? null;

/** The reason codes the module records — the delivery filter's Reason options. */
export const REASON_CODES = Object.keys(REASON_TITLES).filter((code) => code !== 'bounced');

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

/** A table size: `3.1 MB`. */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}
