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
  variables: TypeVariable[];
  defaultChannels: NotificationChannel[];
  /** How many tenants route it their own way. */
  tenantRoutes: number;
  templates: Array<{ channel: NotificationChannel; tenantId: string | null }>;
  gaps: number;
}
