"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/ascendra-ui/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ascendra-ui/components/ui/dialog";
import { Input } from "@/ascendra-ui/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldHint,
} from "@/ascendra-ui/components/ui/field";

function capFirst(reg: { onChange: React.ChangeEventHandler<HTMLInputElement> } & Record<string, unknown>) {
  const { onChange, ...rest } = reg;
  return {
    ...rest,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      e.target.value = v.charAt(0).toUpperCase() + v.slice(1);
      void onChange(e);
    },
  };
}

interface SaveQueryFormValues {
  name: string;
  description: string;
}

interface SaveQueryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, description: string) => void;
}

export function SaveQueryDialog({
  open,
  onOpenChange,
  onSave,
}: SaveQueryDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isValid },
  } = useForm<SaveQueryFormValues>({
    mode: "onChange",
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ name: "", description: "" });
      // Focus the name field after the dialog animates in
      setTimeout(() => setFocus("name"), 50);
    }
  }, [open, reset, setFocus]);

  function handleSave(values: SaveQueryFormValues) {
    onSave(values.name.trim(), values.description.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as My Query</DialogTitle>
          <DialogDescription>
            Save the current filter so it can be run directly next time.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form
            id="save-query-form"
            noValidate
            onSubmit={(e) => void handleSubmit(handleSave)(e)}
            className="space-y-3"
          >
            <Field>
              <FieldLabel htmlFor="query-name">Name</FieldLabel>
              <Input
                id="query-name"
                autoComplete="off"
                placeholder="e.g. Overdue invoices over $10k"
                {...capFirst(register("name", { required: "Name is required" }))}
              />
              <FieldHint error={errors.name} />
            </Field>

            <Field>
              <FieldLabel htmlFor="query-description">Description</FieldLabel>
              <Input
                id="query-description"
                autoComplete="off"
                placeholder="e.g. Filters invoices past due date with amount above $10,000"
                {...capFirst(register("description", { required: "Description is required" }))}
              />
              <FieldHint error={errors.description} />
            </Field>
          </form>
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form="save-query-form" disabled={!isValid}>
            Save Query
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
