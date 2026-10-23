'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  DatePicker,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@/ascendra-ui';
import { authorizationApi } from '@/ascendra-commons-ui/authorization.ui';
import { useAccessScope } from './_scope';
import { tenantName } from './tenants';

/** Every cached read that a change of role can move. */
export function useInvalidateAccess() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      ['authz-stats', 'authz-me', 'authz-me-delegations', 'authz-person', 'authz-holders', 'authz-role', 'authz-assignments-expiring', 'data-table', 'authz-lapsed', 'authz-delegations-expiring'].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    );
}

/**
 * "Give a role" — to one person or many. The roles come from `GET /authz/roles/assignable`: every role, those this
 * viewer can't give disabled with the API's reason (a platform-wide role, an action you don't hold). An optional end
 * date makes it temporary. `tenantId` is where it lands — the person's tenant; a platform admin may also choose
 * "all tenants" for a platform role.
 */
export function AssignRoleDialog({
  open,
  onOpenChange,
  ...props
}: Omit<AssignRoleContentProps, 'onDone'> & { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open && <AssignRoleContent {...props} onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

interface AssignRoleContentProps {
  userIds: string[];
  /** Who it's for, as the title says it ("Farah Garcia", "3 people"). */
  label: string;
  /** The tenant the people belong to (`null` — platform staff). */
  tenantId: string | null;
  /** From a role's page: the role is fixed — named in the title, only the end date to pick. */
  fixedRoleId?: string;
  /** The people by name, shown as badges — when they were picked in an earlier step. */
  people?: Array<{ id: string; name: string }>;
  /** Back to the previous step, in place of Cancel. */
  onBack?: () => void;
  onDone: () => void;
}

/** The dialog's content — a step of another dialog too (a role's "Give this role", after picking people). */
export function AssignRoleContent({ userIds, label, tenantId, fixedRoleId, people, onBack, onDone }: AssignRoleContentProps) {
  const { platform } = useAccessScope();
  const [roleId, setRoleId] = useState<string | undefined>(fixedRoleId);
  const [until, setUntil] = useState<Date | undefined>(undefined);
  const invalidate = useInvalidateAccess();
  // A platform admin assigns into the person's tenant; tenant-less staff get all-tenant (global) assignments.
  const target = tenantId ?? null;
  const roles = useQuery({
    queryKey: ['authz-assignable', target],
    queryFn: () => authorizationApi.assignableRoles(target ?? undefined),
  });
  const choice = roles.data?.find((r) => r.id === roleId);

  const give = useMutation({
    mutationFn: async () => {
      const expiresAt = until?.toISOString();
      if (userIds.length === 1) {
        await authorizationApi.assign(userIds[0], { roleId: roleId!, tenantId: target, expiresAt });
      } else {
        await authorizationApi.assignMany(roleId!, { userIds, tenantId: target ?? undefined, expiresAt });
      }
    },
    onSuccess: async () => {
      toast.success(`${label} ${userIds.length === 1 ? 'now holds' : 'now hold'} ${roleId}`, {
        description: until ? `Until ${until.toLocaleDateString()}` : undefined,
      });
      await invalidate();
      onDone();
    },
    onError: (error) => toast.error(`Couldn't give ${roleId}`, { description: error instanceof Error ? error.message : undefined }),
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{fixedRoleId ? `Give ${fixedRoleId} to ${label}` : `Give a role to ${label}`}</DialogTitle>
        <DialogDescription>
          {target === null ? 'To all tenants — platform staff.' : `In ${tenantName(target)}.`}
          {fixedRoleId ? '' : ' Roles you can\u2019t give are shown with the reason.'}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        {people && people.length > 0 && (
          <Field>
            <FieldLabel>To</FieldLabel>
            {/* Who was picked in the step before — shown, not edited here (Back changes it). */}
            <Combobox multiple readOnly items={people.map((p) => p.id)} value={people.map((p) => p.id)}>
              <ComboboxChips>
                {people.map((p) => (
                  <ComboboxChip key={p.id} showRemove={false}>
                    {p.name}
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput readOnly aria-label="People" className="w-0 min-w-0 flex-none p-0" />
              </ComboboxChips>
            </Combobox>
          </Field>
        )}
        {!fixedRoleId && (
          <Field>
            <FieldLabel htmlFor="assign-role">Role</FieldLabel>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger id="assign-role" className="w-full">
                <SelectValue placeholder={roles.isLoading ? 'Loading roles…' : 'Choose a role'} />
              </SelectTrigger>
              <SelectContent>
                {(roles.data ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.id} disabled={!r.assignable}>
                    <span className="flex flex-col">
                      <span>{r.id}</span>
                      <span className="text-muted-foreground text-xs">{r.assignable ? (r.description ?? `${r.actions.length} actions`) : r.reason}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {choice && !choice.assignable && <FieldHint description={choice.reason} />}
          </Field>
        )}
        {fixedRoleId && choice && !choice.assignable && <p className="text-destructive text-sm">{choice.reason}</p>}
        <Field>
          <FieldLabel htmlFor="assign-until">Until</FieldLabel>
          <DatePicker id="assign-until" value={until} onChange={setUntil} minDate={new Date()} placeholder="No end date" showClear />
          <FieldHint description="Optional — for cover or a contractor. The role stops applying at the start of that day." optional />
        </Field>
        {platform && target === null && <p className="text-muted-foreground text-xs">An all-tenant role reaches every tenant — keep these few.</p>}
      </DialogBody>
      <DialogFooter>
        {onBack ? (
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        ) : (
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
        )}
        <Button disabled={!choice?.assignable || give.isPending} onClick={() => give.mutate()}>
          {give.isPending ? 'Giving…' : roleId ? `Give ${roleId}` : 'Give role'}
        </Button>
      </DialogFooter>
    </>
  );
}
