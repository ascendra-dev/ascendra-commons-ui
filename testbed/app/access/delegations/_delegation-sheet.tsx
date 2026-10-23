'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import {
  Button,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetKey,
  SheetProperties,
  SheetSection,
  SheetTitle,
  SheetValue,
  SimpleBadge,
  toast,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import {
  authorizationApi,
  authorizationLinks,
  DELEGATION_STATE,
  delegationState,
  type DelegationRow,
} from '@/ascendra-commons-ui/authorization.ui';
import { useInvalidateAccess } from '../_assign-dialog';
import { ConfirmDialog } from '../_confirm';
import { useAccessScope } from '../_scope';
import { tenantName } from '../tenants';

/**
 * One delegation in full — who lent what to whom, why, until when, and what no longer grants. Revoke for its lender,
 * receiver, a role admin of its tenant or a platform admin — the API's own rule, so the button shows only to them.
 */
export function DelegationSheet({ delegation: d, onClose }: { delegation: DelegationRow; onClose: () => void }) {
  const { can, platform, actorId } = useAccessScope();
  const mayRevoke = platform || can('authz.assign_roles') || d.granterId === actorId || d.granteeId === actorId;
  const [confirming, setConfirming] = useState(false);
  const invalidate = useInvalidateAccess();
  const state = DELEGATION_STATE[delegationState(d)];
  const revoke = useMutation({
    mutationFn: () => authorizationApi.revokeDelegation(d.id),
    onSuccess: async () => {
      toast.success('Delegation revoked', { description: `${d.granteeName} no longer has ${d.actions.join(', ')} from ${d.granterName}.` });
      await invalidate();
      onClose();
    },
    onError: (error) => toast.error("Couldn't revoke it", { description: error instanceof Error ? error.message : undefined }),
  });

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {d.granterName} → {d.granteeName}
          </SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-1.5">
            <SimpleBadge variant={state.variant}>{state.label}</SimpleBadge> {tenantName(d.tenantId)}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <SheetSection>
            <SheetProperties>
              <SheetKey>Lends</SheetKey>
              <SheetValue>
                <div className="flex flex-wrap gap-1">
                  {d.actions.map((a) => (
                    <SimpleBadge key={a} variant={d.lapsedActions.includes(a) ? 'secondary' : 'default'} className={d.lapsedActions.includes(a) ? 'line-through' : undefined}>
                      {a}
                    </SimpleBadge>
                  ))}
                </div>
                {d.lapsedActions.length > 0 && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {d.granterName} no longer holds {d.lapsedActions.join(', ')} — it grants nothing for {d.lapsedActions.length === 1 ? 'it' : 'them'} (and comes back if they get it back).
                  </p>
                )}
              </SheetValue>
              <SheetKey>Until</SheetKey>
              <SheetValue>{formatDateTime(d.expiresAt, { time: true })}</SheetValue>
              <SheetKey>Why</SheetKey>
              <SheetValue>{d.reason ?? <span className="text-muted-foreground">no reason given</span>}</SheetValue>
              <SheetKey>Lent</SheetKey>
              <SheetValue>{formatDateTime(d.createdAt, { time: true })}</SheetValue>
              {d.revokedAt && (
                <>
                  <SheetKey>Revoked</SheetKey>
                  <SheetValue>{formatDateTime(d.revokedAt, { time: true })}{d.revokedBy ? ` by ${d.revokedBy}` : ''}</SheetValue>
                </>
              )}
              <SheetKey>People</SheetKey>
              <SheetValue className="flex flex-col">
                <Link className="underline underline-offset-2" href={authorizationLinks.person(d.granterId)}>{d.granterName}</Link>
                <Link className="underline underline-offset-2" href={authorizationLinks.person(d.granteeId)}>{d.granteeName}</Link>
              </SheetValue>
            </SheetProperties>
          </SheetSection>
        </SheetBody>
        {d.status === 'active' && mayRevoke && (
          <SheetFooter>
            <Button variant="destructive" onClick={() => setConfirming(true)}>
              Revoke
            </Button>
          </SheetFooter>
        )}
        {confirming && (
          <ConfirmDialog
            open
            onOpenChange={setConfirming}
            title="Revoke this delegation?"
            description={`${d.granteeName} loses ${d.actions.join(', ')} from ${d.granterName} now.`}
            confirmLabel="Revoke"
            pending={revoke.isPending}
            onConfirm={() => revoke.mutate()}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
