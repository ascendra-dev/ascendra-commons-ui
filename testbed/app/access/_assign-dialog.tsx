'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
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
      ['authz-stats', 'authz-person', 'authz-holders', 'authz-role', 'authz-assignments-expiring', 'data-table', 'authz-lapsed', 'authz-delegations-expiring'].map((key) =>
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
  userIds,
  label,
  tenantId,
  fixedRoleId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userIds: string[];
  /** Who it's for, as the title says it ("Farah Garcia", "3 people"). */
  label: string;
  /** The tenant the people belong to (`null` — platform staff). */
  tenantId: string | null;
  /** From a role's page: the role is fixed, the dialog picks only the end date. */
  fixedRoleId?: string;
}) {
  const { platform } = useAccessScope();
  const [roleId, setRoleId] = useState<string | undefined>(fixedRoleId);
  const [until, setUntil] = useState<Date | undefined>(undefined);
  const invalidate = useInvalidateAccess();
  // A platform admin assigns into the person's tenant; tenant-less staff get all-tenant (global) assignments.
  const target = tenantId ?? null;
  const roles = useQuery({
    queryKey: ['authz-assignable', target],
    queryFn: () => authorizationApi.assignableRoles(target ?? undefined),
    enabled: open,
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
      onOpenChange(false);
    },
    onError: (error) => toast.error(`Couldn't give ${roleId}`, { description: error instanceof Error ? error.message : undefined }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Give a role to {label}</DialogTitle>
          <DialogDescription>
            {target === null ? 'To all tenants — platform staff.' : `In ${tenantName(target)}.`} Roles you can&apos;t give are shown with the reason.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="assign-role">Role</FieldLabel>
            <Select value={roleId} onValueChange={setRoleId} disabled={!!fixedRoleId}>
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
          <Field>
            <FieldLabel htmlFor="assign-until">Until</FieldLabel>
            <DatePicker id="assign-until" value={until} onChange={setUntil} minDate={new Date()} placeholder="No end date" showClear />
            <FieldHint description="Optional — for cover or a contractor. The role stops applying at the start of that day." optional />
          </Field>
          {platform && target === null && <p className="text-muted-foreground text-xs">An all-tenant role reaches every tenant — keep these few.</p>}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button disabled={!choice?.assignable || give.isPending} onClick={() => give.mutate()}>
            {give.isPending ? 'Giving…' : roleId ? `Give ${roleId}` : 'Give role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
