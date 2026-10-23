'use client';

import { useState } from 'react';
import {
  Button,
  Checkbox,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@/ascendra-ui';

/** Pick several from a list — a search box over checkboxes, then Next. A dialog's first step (render inside DialogContent). */
export function PickContent({
  title,
  description,
  loading,
  options,
  picked,
  onPick,
  onNext,
}: {
  title: string;
  description: string;
  loading: boolean;
  options: Array<{ value: string; label: string; hint?: string }>;
  picked: string[];
  onPick: (values: string[]) => void;
  onNext: () => void;
}) {
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();
  const shown = options.filter((o) => !needle || o.label.toLowerCase().includes(needle) || (o.hint ?? '').toLowerCase().includes(needle));
  const toggle = (value: string) => onPick(picked.includes(value) ? picked.filter((v) => v !== value) : [...picked, value]);
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-3">
        <Input type="search" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} full />
        <div className="max-h-72 overflow-y-auto">
          {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {!loading && shown.length === 0 && <p className="text-muted-foreground text-sm">Nobody to pick.</p>}
          {shown.map((o) => (
            <label key={o.value} className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5">
              <Checkbox checked={picked.includes(o.value)} onCheckedChange={() => toggle(o.value)} />
              <span className="flex flex-col">
                <span className="text-sm">{o.label}</span>
                {o.hint && <span className="text-muted-foreground text-xs">{o.hint}</span>}
              </span>
            </label>
          ))}
        </div>
      </DialogBody>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary">Cancel</Button>
        </DialogClose>
        <Button disabled={picked.length === 0} onClick={onNext}>
          Next{picked.length ? ` (${picked.length})` : ''}
        </Button>
      </DialogFooter>
    </>
  );
}
