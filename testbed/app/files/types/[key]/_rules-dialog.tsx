'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
  FieldHint,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@/ascendra-ui';
import { contentTypeLabel, fileStorageApi, formatBytes, type FileCategoryView } from '@/ascendra-commons-ui/file-storage.ui';

const MB = 1024 * 1024;

/** Same members, any order. */
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

/**
 * A tenant's own rules for one upload type — only narrowing is offered: content types and extensions from the app's
 * list, a smaller size, and "refuse" for a file the scanner can't read. A value equal to the app's is saved as
 * "inherit" (null), so a later change to the app's rule reaches the tenant. The API refuses a loosening (422) too.
 */
export function RulesDialog({
  view,
  tenantId,
  tenant,
  onClose,
  onSaved,
}: {
  view: FileCategoryView;
  /** A platform admin acting for a tenant; omitted for a tenant admin (the API uses its own). */
  tenantId: string | undefined;
  tenant: string;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
}) {
  const { base, effective } = view;
  const [types, setTypes] = useState(effective.allowedContentTypes);
  const [exts, setExts] = useState(effective.allowedExtensions ?? []);
  const [maxMb, setMaxMb] = useState(String(+(effective.maxSizeBytes / MB).toFixed(2)));
  const [scan, setScan] = useState(effective.onUnscannable);

  const maxBytes = Math.round(Number(maxMb) * MB);
  const sizeError =
    !maxMb.trim() || !Number.isFinite(maxBytes) || maxBytes < 1
      ? 'A size above 0.'
      : maxBytes > base.maxSizeBytes
        ? `May only be smaller than the app's ${formatBytes(base.maxSizeBytes)}.`
        : maxBytes < (base.minSizeBytes ?? 1)
          ? `May not be under the app's minimum, ${formatBytes(base.minSizeBytes ?? 1)}.`
          : null;
  const typesError = base.allowedContentTypes.length > 0 && types.length === 0 ? 'Keep at least one — none would refuse every upload.' : null;
  const extsError = (base.allowedExtensions?.length ?? 0) > 0 && exts.length === 0 ? 'Keep at least one.' : null;
  const invalid = !!(sizeError || typesError || extsError);

  const save = useMutation({
    mutationFn: () =>
      fileStorageApi.updateCategory(view.key, {
        ...(tenantId ? { tenantId } : {}),
        allowedContentTypes: sameSet(types, base.allowedContentTypes) ? null : types,
        allowedExtensions: !base.allowedExtensions || sameSet(exts, base.allowedExtensions) ? null : exts,
        maxSizeBytes: maxBytes === base.maxSizeBytes ? null : maxBytes,
        onUnscannable: scan === base.onUnscannable ? null : scan,
      }),
    onSuccess: async () => {
      toast.success(`${tenant}'s rules saved`, { description: `${base.label} — its next upload is checked against them.` });
      await onSaved();
      onClose();
    },
    onError: (error) => toast.error("Couldn't save the rules", { description: error instanceof Error ? error.message : undefined }),
  });

  const toggle = (list: string[], set: (v: string[]) => void, order: string[], value: string, on: boolean) =>
    set(order.filter((x) => (x === value ? on : list.includes(x))));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {tenant}&apos;s rules — {base.label}
          </DialogTitle>
          <DialogDescription>Only tighter than the app&apos;s. A rule left as the app&apos;s follows it if it changes. Audited.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          {base.allowedContentTypes.length > 0 && (
            <Field>
              <FieldLabel>Content types</FieldLabel>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {base.allowedContentTypes.map((t) => (
                  <label key={t} className="flex cursor-pointer items-center gap-2">
                    <Checkbox checked={types.includes(t)} onCheckedChange={(on) => toggle(types, setTypes, base.allowedContentTypes, t, on === true)} />
                    {contentTypeLabel(t)}
                  </label>
                ))}
              </div>
              {typesError ? <p className="text-destructive text-xs">{typesError}</p> : <FieldHint description="Only from the app's list." />}
            </Field>
          )}
          {base.allowedExtensions && base.allowedExtensions.length > 0 && (
            <Field>
              <FieldLabel>Extensions</FieldLabel>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {base.allowedExtensions.map((e) => (
                  <label key={e} className="flex cursor-pointer items-center gap-2 font-mono text-xs">
                    <Checkbox checked={exts.includes(e)} onCheckedChange={(on) => toggle(exts, setExts, base.allowedExtensions!, e, on === true)} />
                    {e}
                  </label>
                ))}
              </div>
              {extsError ? <p className="text-destructive text-xs">{extsError}</p> : <FieldHint description="Checked as well as the content type." />}
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="rules-max-size">Max size (MB)</FieldLabel>
            <Input id="rules-max-size" type="number" min={0} step="any" inputMode="decimal" value={maxMb} onChange={(e) => setMaxMb(e.target.value)} full />
            {sizeError ? <p className="text-destructive text-xs">{sizeError}</p> : <FieldHint description={`The app allows up to ${formatBytes(base.maxSizeBytes)}.`} />}
          </Field>
          <Field>
            <FieldLabel htmlFor="rules-scan">If the scanner can&apos;t read a file</FieldLabel>
            {base.onUnscannable === 'reject' ? (
              <p>
                refuse <span className="text-muted-foreground">— the app&apos;s; it can&apos;t be loosened to &ldquo;store&rdquo;</span>
              </p>
            ) : (
              <Select value={scan} onValueChange={(v) => setScan(v as 'reject' | 'allow')}>
                <SelectTrigger id="rules-scan" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">store it — the app&apos;s</SelectItem>
                  <SelectItem value="reject">refuse it</SelectItem>
                </SelectContent>
              </Select>
            )}
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button disabled={invalid || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
