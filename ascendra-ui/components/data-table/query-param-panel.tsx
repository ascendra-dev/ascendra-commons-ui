"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { UnsavedChangesBar } from "@/ascendra-ui/components/common-ui/unsaved-changes-bar";
import { Card } from "@/ascendra-ui/components/card/card";
import { CardFooter } from "@/ascendra-ui/components/card/card-footer";
import { CardHeader } from "@/ascendra-ui/components/card/card-header";
import { CardPanel } from "@/ascendra-ui/components/card/card-panel";
import { CardPanelItem } from "@/ascendra-ui/components/card/card-panel-item";
import { Button } from "@/ascendra-ui/components/ui/button";
import {
  useIsQueryParamPanelOpen,
  useQueryContext,
} from "@/ascendra-ui/providers/data-table-query/data-table-query.provider";
import type {
  ColumnsConfig,
  FieldDef,
  ParamItem,
  QueryParamValues,
} from "@/ascendra-ui/providers/data-table-query/data-table-query.types";
import {
  buildDefaultValues,
  buildZodSchema,
} from "@/ascendra-ui/providers/data-table-query/query-params-schema";
import { isFieldDef } from "@/ascendra-ui/providers/data-table-query/data-table-query.types";
import { cn } from "@/ascendra-ui/shadcn";
import { BookmarkPlus, XIcon } from "lucide-react";
import { CardFooterIcon } from "@/ascendra-ui/components/card/card-footer-icon";
import { IoColorFilterOutline } from "react-icons/io5";
import { SaveQueryDialog } from "./save-query-dialog";
import { QueryFieldRenderer } from "./query-field-renderer";

interface SectionGroup {
  title: string | null;
  showTitle: boolean;
  fields: FieldDef[];
}

function groupParamSections(params: ParamItem[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  let current: SectionGroup = { title: null, showTitle: false, fields: [] };

  for (const item of params) {
    if (isFieldDef(item)) {
      current.fields.push(item);
    } else {
      if (current.fields.length > 0) groups.push(current);
      current = {
        title: item.title,
        showTitle: item.showTitle ?? false,
        fields: [],
      };
    }
  }

  if (current.fields.length > 0) groups.push(current);
  return groups;
}

// Static lookup tables — template literals would be invisible to Tailwind's scanner
const SM_COLS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};
const MD_COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};
const LG_COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

function getColumnsClass(columns?: ColumnsConfig): string {
  const cfg = { sm: 1, md: 1, lg: 1, ...columns };
  return cn("grid-cols-1", SM_COLS[cfg.sm], MD_COLS[cfg.md], LG_COLS[cfg.lg]);
}

function getSpanClass(field: FieldDef): string {
  const span = field.span ?? "full";
  if (span === "full") return "col-span-full";
  if (span === 2) return "col-span-2";
  return "col-span-1";
}

export function QueryParamPanel() {
  const { activeQuery } = useQueryContext();
  const showParamPanel = useIsQueryParamPanelOpen();

  if (!showParamPanel) return null;

  return <QueryParamPanelInner key={activeQuery.id} />;
}

function QueryParamPanelInner() {
  "use no memo";
  const {
    activeQuery,
    setConfirmedParams,
    isLoading,
    confirmPending,
    cancelPending,
    canCancelPending,
    getDraftValues,
    saveDraftValues,
    saveAsUserQuery,
  } = useQueryContext();
  const params = activeQuery.params!;
  const fields = useMemo(() => params.filter(isFieldDef), [params]);
  const groups = useMemo(() => groupParamSections(params), [params]);

  const schema = useMemo(() => buildZodSchema(fields), [fields]);
  const defaultValues = useMemo(() => buildDefaultValues(fields), [fields]);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "all",
  });

  // Restore draft or last-run params on mount
  useEffect(() => {
    const saved = getDraftValues(activeQuery.id);
    if (saved) methods.reset(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save current form state to draft cache on unmount
  useEffect(() => {
    return () => {
      saveDraftValues(activeQuery.id, methods.getValues() as QueryParamValues);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRunQuery = async (): Promise<boolean> => {
    const valid = await methods.trigger();
    if (!valid) return false;

    return new Promise<boolean>((resolve) => {
      methods.handleSubmit((data) => {
        setConfirmedParams(data as QueryParamValues);
        confirmPending();
        resolve(true);
      })();
    });
  };

  const { isValid } = methods.formState;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <IoColorFilterOutline className="text-muted-foreground size-5 shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{activeQuery.title}</span>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {activeQuery.description}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isValid && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => setSaveDialogOpen(true)}
                >
                  <BookmarkPlus className="size-3.5" />
                  Save as My Query
                </Button>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="size-7 shrink-0 px-0"
                aria-label="Close filter and return to the previous results"
                disabled={!canCancelPending}
                onClick={cancelPending}
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <SaveQueryDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          onSave={(name, description) => {
            saveAsUserQuery(
              activeQuery.id,
              name,
              description,
              methods.getValues() as QueryParamValues,
            );
          }}
        />
        <CardPanel>
          <FormProvider {...methods}>
            <form noValidate>
              {groups.map((group, i) => (
                <CardPanelItem
                  key={i}
                  className={cn(group.showTitle && "relative")}
                >
                  {group.showTitle && group.title && (
                    <>
                      <div className="pointer-events-none absolute inset-0 -top-px border-t border-dashed border-gray-400/50" />
                      <div className="text-muted-foreground bg-background pointer-events-none absolute -top-3 left-2 z-10 ml-2 rounded-full border border-dashed border-gray-400/50 px-1.5 py-0.5 text-2xs opacity-100">
                        {group.title}
                      </div>
                    </>
                  )}
                  <div
                    className={cn(
                      "grid gap-5",
                      getColumnsClass(activeQuery.columns),
                    )}
                  >
                    {group.fields.map((field) => (
                      <div key={field.name} className={getSpanClass(field)}>
                        <QueryFieldRenderer field={field} />
                      </div>
                    ))}
                  </div>
                </CardPanelItem>
              ))}
            </form>
          </FormProvider>
        </CardPanel>
        {activeQuery.info && (
          <CardFooter>
            <CardFooterIcon />
            {activeQuery.info}
          </CardFooter>
        )}
      </Card>

      <UnsavedChangesBar
        isDirty
        isSaving={isLoading}
        isValid={methods.formState.isValid}
        onSave={handleRunQuery}
        onReset={() => methods.reset(defaultValues)}
        onInvalid={() => {
          void methods.trigger();
        }}
        saveLabel="Run Query"
        resetLabel="Reset"
        message="Fill the filter values"
        validationMessage="Fix the errors before running"
        savingMessage="Running query…"
        successMessage="Query applied"
        errorMessage="Query failed — please try again"
        className="lg:left-[calc(50%+7.75rem)]"
      />
    </>
  );
}
