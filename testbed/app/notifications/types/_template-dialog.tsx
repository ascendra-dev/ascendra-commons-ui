'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupTextarea,
  SimpleBadge,
  Skeleton,
  toast,
} from '@/ascendra-ui';
import {
  channelLabel,
  hasSubject,
  notificationApi,
  variableToken,
  type NotificationChannel,
  type NotificationTypeDetail,
  type Template,
} from '@/ascendra-commons-ui/notification.ui';
import { tenantName } from '../tenants';
import { useInvalidateConfig } from './_route-dialog';

const PREVIEW_DELAY_MS = 400;

/** `value`, once it has stopped changing for `ms`. */
function useSettled<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

/**
 * Write a type's text on one channel — the default, or one tenant's own (white-labelled), which wins for that tenant.
 * Variables come from the type's palette; the preview renders with the type's samples as you type, and a variable the
 * type doesn't have is caught here, before it reaches a customer. Saving is audited; the next send uses it.
 */
export function TemplateDialog({
  type,
  channel,
  tenantId,
  existing,
  fallback,
  onClose,
}: {
  type: NotificationTypeDetail;
  channel: NotificationChannel;
  tenantId: string | null;
  /** The row being edited — absent when writing a new one. */
  existing?: Template;
  /** The default a new tenant template starts from. */
  fallback?: Template;
  onClose: () => void;
}) {
  const start = existing ?? fallback;
  const withSubject = hasSubject(channel);
  const [subject, setSubject] = useState(start?.subject ?? '');
  const [body, setBody] = useState(start?.body ?? '');
  const [isHtml, setIsHtml] = useState(start?.isHtml ?? false);
  const focused = useRef<'subject' | 'body'>('body');
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const invalidate = useInvalidateConfig();

  const candidate = { subject: withSubject ? subject : '', body, isHtml };
  const settled = useSettled(candidate, PREVIEW_DELAY_MS);
  const preview = useQuery({
    queryKey: ['notification-preview', type.name, settled],
    queryFn: () =>
      notificationApi.preview({ notificationType: type.name, body: settled.body, isHtml: settled.isHtml, ...(withSubject && settled.subject ? { subject: settled.subject } : {}) }),
    enabled: settled.body.trim() !== '',
    retry: false,
  });
  const upToDate = JSON.stringify(settled) === JSON.stringify(candidate);

  const whose = tenantId ? `${tenantName(tenantId)}'s own` : 'The default';
  const save = useMutation({
    mutationFn: () =>
      notificationApi.setTemplate({ channel, notificationType: type.name, tenantId, subject: withSubject ? subject || null : null, body, isHtml: channel === 'email' && isHtml }),
    onSuccess: async () => {
      toast.success(`${channelLabel(channel)} template saved`, { description: `${whose} ${type.name} — the next send uses it.` });
      await invalidate();
      onClose();
    },
    onError: (error) => toast.error("Couldn't save the template", { description: error instanceof Error ? error.message : undefined }),
  });
  const remove = useMutation({
    mutationFn: () => notificationApi.deleteTemplate(channel, type.name, tenantId),
    onSuccess: async () => {
      toast.success(`${tenantName(tenantId)} uses the default ${channelLabel(channel)} text again`);
      await invalidate();
      onClose();
    },
    onError: (error) => toast.error("Couldn't delete it", { description: error instanceof Error ? error.message : undefined }),
  });

  /** Put `{{name}}` where the cursor was, in the field last typed in. */
  const insert = (name: string) => {
    const token = variableToken(name);
    const into = focused.current === 'subject' && withSubject ? subjectRef.current : bodyRef.current;
    const value = focused.current === 'subject' && withSubject ? subject : body;
    const set = focused.current === 'subject' && withSubject ? setSubject : setBody;
    const at = into?.selectionStart ?? value.length;
    const end = into?.selectionEnd ?? at;
    set(value.slice(0, at) + token + value.slice(end));
    requestAnimationFrame(() => {
      into?.focus();
      into?.setSelectionRange(at + token.length, at + token.length);
    });
  };

  const busy = save.isPending || remove.isPending;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl" focusField>
        <DialogHeader>
          <DialogTitle>
            {channelLabel(channel)} template — {type.name}
            {tenantId ? ` · ${tenantName(tenantId)}` : ''}
          </DialogTitle>
          <DialogDescription>
            {tenantId
              ? `${tenantName(tenantId)}'s own — wins over the default for ${tenantName(tenantId)}.${!existing && fallback ? ' Starts from the default text.' : ''}`
              : 'The default — every tenant without its own text gets it.'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            {withSubject && (
              <Field>
                <FieldLabel htmlFor="template-subject">{channel === 'in_app' ? 'Title' : 'Subject'}</FieldLabel>
                <Input
                  id="template-subject"
                  ref={subjectRef}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onFocus={() => (focused.current = 'subject')}
                  full
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="template-body">Body</FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id="template-body"
                  ref={bodyRef}
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onFocus={() => (focused.current = 'body')}
                  className="font-mono text-xs"
                />
              </InputGroup>
            </Field>
            <div className="flex flex-wrap gap-1">
              {type.variables.map((v) => (
                <button key={v.name} type="button" onClick={() => insert(v.name)} className="cursor-pointer">
                  <SimpleBadge variant="violet" className="font-mono">
                    + {v.name}
                  </SimpleBadge>
                </button>
              ))}
              {type.variables.length === 0 && <span className="text-muted-foreground text-xs">This type declares no variables.</span>}
            </div>
            {channel === 'email' && (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={isHtml} onCheckedChange={(on) => setIsHtml(on === true)} />
                The body is HTML
              </label>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Preview — with the samples</span>
            <div className="bg-muted/50 min-h-40 rounded-md border p-3 text-sm">
              {body.trim() === '' ? (
                <span className="text-muted-foreground">Write the body to see it.</span>
              ) : preview.isError ? (
                <span className="text-destructive">{preview.error instanceof Error ? preview.error.message : 'It can’t be rendered.'}</span>
              ) : !preview.data ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className={upToDate ? undefined : 'opacity-60'}>
                  {preview.data.subject && <div className="mb-2 font-medium">{preview.data.subject}</div>}
                  {isHtml ? (
                    <iframe title="Preview" sandbox="" srcDoc={preview.data.body} className="h-56 w-full rounded bg-white" />
                  ) : (
                    <div className="whitespace-pre-wrap">{preview.data.body}</div>
                  )}
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {channel === 'sms' ? 'An SMS has no subject. ' : channel === 'in_app' ? "An in-app item's title is its subject. " : ''}
              Saving is audited with before and after; the next send uses it at once.
            </p>
          </div>
        </DialogBody>
        <DialogFooter>
          {existing && tenantId && (
            <Button variant="secondary" className="mr-auto" disabled={busy} onClick={() => remove.mutate()}>
              Delete — use the default
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button disabled={busy || !upToDate || !preview.isSuccess} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
