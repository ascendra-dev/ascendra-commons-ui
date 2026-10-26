/** Wire shapes of `ascendra-commons`' `notification.api` — dates arrive as ISO strings. */

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'in_app';

/** `skipped` — deliberately not sent (suppressed, opted out); `reason` says which. */
export type DeliveryStatus = 'sent' | 'failed' | 'delivered' | 'bounced' | 'skipped';

/** One send attempt on one channel — `GET /notifications/deliveries`. */
export interface Delivery {
  id: string;
  notificationType: string;
  channel: NotificationChannel;
  tenantId: string | null;
  /** `user:<id>`, or `raw:<channel>` for a guest — whose address is never stored. */
  recipientRef: string;
  /** `user:<id>` or a keyed hash of a guest's address — what "everything to this recipient" filters by. */
  recipientKey: string | null;
  /** A user recipient's name, from the app's user directory; null for a guest. */
  recipientName: string | null;
  status: DeliveryStatus;
  /** `code` or `code: the provider's detail` — e.g. `provider_timeout: no answer within 10s`. */
  reason: string | null;
  providerMessageId: string | null;
  attemptedAt: string;
  /** The last status change — a provider callback (delivered, bounced) moves it. */
  updatedAt: string;
  correlationId: string | null;
  /** The rendered message (or a failed send's variables) is still stored — cleared after the retention period. */
  hasContent: boolean;
  /** A test send — hidden from the log unless asked for, left out of the numbers. */
  isTest: boolean;
  /** The delivery this one retries. */
  retryOf: string | null;
  /** The latest delivery retrying this one. */
  retriedBy: string | null;
}

/** `GET /notifications/deliveries/:id/content` — the message as sent; a failed send has only its variables. */
export interface DeliveryContent {
  id: string;
  notificationType: string;
  channel: NotificationChannel;
  recipientRef: string;
  attemptedAt: string;
  content: {
    subject: string | null;
    body: string | null;
    isHtml: boolean;
    variables: Record<string, unknown>;
  };
}

/** One channel's outcome of a send. */
export interface ChannelResult {
  status: 'sent' | 'failed' | 'skipped';
  reason?: string;
  providerMessageId?: string;
}

/** `POST …/retry` and `POST /notifications/test-send` — over the channels not skipped. */
export interface SendResult {
  status: 'sent' | 'partial' | 'failed' | 'skipped';
  reason?: string;
  channels?: Partial<Record<NotificationChannel, ChannelResult>>;
}

/** One variable a type's templates may use, with the sample a preview and a test send fill in. */
export interface TypeVariable {
  name: string;
  sample?: unknown;
}

/** `GET /notifications/types` — a declared type (or a configured one nobody declares any more, `declared: false`). */
export interface NotificationTypeSummary {
  name: string;
  declared: boolean;
  description: string | null;
  /** Who it reaches — the app's own words (`payer`, `tenant staff`…). */
  audience: string | null;
  /** Always sent — a user can't turn it off. */
  required: boolean;
  variables: TypeVariable[];
  /** The default route's channels — null when there's no default route. */
  defaultChannels: NotificationChannel[] | null;
  /** How many tenants route it their own way. */
  tenantRoutes: number;
  templates: Array<{ channel: NotificationChannel; tenantId: string | null }>;
  gaps: number;
}

/** The overview's window: the last 24 hours rolling, or whole calendar days in the viewer's zone. */
export type StatsWindow = '24h' | '7d' | '30d';

/** `GET /notifications/stats` — test sends left out. */
export interface DeliveryStats {
  since: string;
  until: string;
  byChannel: Array<{ channel: NotificationChannel; status: DeliveryStatus; count: number }>;
  byType: Array<{ notificationType: string; status: DeliveryStatus; count: number }>;
  /** Every day of a day window (a quiet one at 0); `failed` counts failed and bounced. */
  byDay: Array<{ day: string; count: number; failed: number }>;
  /** Failed, skipped and bounced sends by the reason's code — a bounce is one group, `bounced`. */
  byReason: Array<{ status: 'failed' | 'skipped' | 'bounced'; reason: string; count: number }>;
}

/** `GET /notifications/config/coverage-gaps` — what will fail the next send of a type on a channel. */
export interface CoverageGap {
  notificationType: string;
  /** null — the default route, checked for every tenant. */
  tenantId: string | null;
  channel: NotificationChannel;
  kind: 'missing_template' | 'missing_provider_credential';
}

/** `GET /notifications/volume` — platform admins only. */
export interface DeliveryVolume {
  oldestAttemptedAt: string | null;
  rowCount: number;
  /** Rows still holding the message — retention clears it sooner than the row. */
  contentRowCount: number;
  oldestContentAt: string | null;
  tableSizeBytes: number | null;
  perDay: Array<{ day: string; deliveries: number; failed: number; withContent: number }>;
}

/** One route — the channels a type goes out on; `tenantId` null is the default every tenant gets. */
export interface ChannelRoute {
  notificationType: string;
  tenantId: string | null;
  channels: NotificationChannel[];
}

/** One template — a type's text on a channel; a tenant's own wins over the default. */
export interface Template {
  channel: NotificationChannel;
  notificationType: string;
  tenantId: string | null;
  subject: string | null;
  body: string;
  isHtml: boolean;
}

/** `GET /notifications/types/:name` — every route and template the viewer may see, and its gaps. */
export interface NotificationTypeDetail extends Omit<NotificationTypeSummary, 'tenantRoutes' | 'templates' | 'gaps'> {
  routes: ChannelRoute[];
  templates: Template[];
  gaps: CoverageGap[];
}

/** `POST /notifications/test-send` — a user (yourself, a colleague) or, for a platform admin, an address. */
export type TestRecipient = { type: 'user'; id: string } | { type: 'raw'; email?: string; phone?: string };

/** `GET /notifications/config/credentials` — which accounts exist; keys are write-only, never returned. */
export interface ProviderCredential {
  channel: NotificationChannel;
  /** null — the platform's own: tenantless sends, and the fallback for a tenant without one. */
  tenantId: string | null;
}

/** `POST …/credentials/:channel/verify` — the provider's answer; a stub can't check (`supported: false`). */
export interface CredentialCheck {
  supported: boolean;
  ok?: boolean;
  detail?: string;
}

/** `GET /notifications/suppressions` — a recipient a channel stopped sending to; applies to the whole app. */
export interface Suppression {
  id: string;
  channel: NotificationChannel;
  recipientKey: string;
  /** The tenant whose send bounced first — the entry is filed under it. */
  tenantId: string | null;
  /** `bounced` (a hard bounce) or `complaint`. */
  reason: string;
  detail: string | null;
  firstAt: string;
  lastAt: string;
  eventCount: number;
  /** This viewer may remove it — a tenant admin only those its own tenant filed. */
  removable: boolean;
  recipientName: string | null;
}
