"use client";

import { useMemo } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LuTriangleAlert } from "react-icons/lu";

import {
  cn,
  Label,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ascendra-ui/shadcn";
import { SimpleBadge } from "@/ascendra-ui/components/common-ui/simple-badge";

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className,
      )}
      {...props}
    />
  );
}

function FieldGrid({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-grid"
      className={cn("grid grid-cols-1 gap-5 sm:grid-cols-2", className)}
      {...props}
    />
  );
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
        className,
      )}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
        className,
      )}
      {...props}
    />
  );
}

const fieldVariants = cva(
  "data-[invalid=true]:text-destructive gap-2 group/field flex w-full",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:*:data-[slot=field-label]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  },
);

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-0.5 leading-snug",
        className,
      )}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "has-data-checked:bg-primary/5 has-data-checked:border-primary/30 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10 group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border *:data-[slot=field]:p-2.5",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function FieldLabelGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label-group"
      className={cn("", className)}
      {...props}
    />
  );
}

const fieldInfoBreakpointClasses: Record<string, string> = {
  sm: "hidden sm:block",
  md: "hidden md:block",
  lg: "hidden lg:block",
  xl: "hidden xl:block",
  "2xl": "hidden 2xl:block",
};

function FieldInfo({
  className,
  children,
  breakPoint,
  ...props
}: React.ComponentProps<"p"> & {
  breakPoint?: "sm" | "md" | "lg" | "xl" | "2xl";
}) {
  if (!children && breakPoint) {
    return (
      <p
        aria-hidden
        data-slot="field-info"
        className={cn(
          "mt-0.5 text-xs",
          fieldInfoBreakpointClasses[breakPoint],
          className,
        )}
        {...props}
      >
        &nbsp;
      </p>
    );
  }

  return (
    <p
      data-slot="field-info"
      className={cn("mt-0.5 text-xs", className)}
      {...props}
    >
      {children}
    </p>
  );
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-muted-foreground text-left text-xs leading-normal font-normal group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
        "last:mt-0 nth-last-2:-mt-1",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className,
      )}
      {...props}
    />
  );
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className,
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="text-muted-foreground bg-background relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ];

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>,
        )}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-destructive text-sm font-normal", className)}
      {...props}
    >
      {content}
    </div>
  );
}

function FieldHint({
  error,
  // Defaults to a non-breaking space — a plain " " collapses under normal
  // HTML/CSS whitespace handling and does not reliably reserve line height;
  // " " (the same character &nbsp; represents) does not collapse. Same
  // convention FieldInfo above already uses for its own empty-state case.
  // This default lets a bare <FieldHint /> — the dominant real usage across
  // every form in this library — always reserve its row's height instead of
  // collapsing to zero, matching what that usage already assumes is happening.
  description = " ",
  mandatory,
  optional,
  help,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  error?: { message?: string };
  description?: string;
  mandatory?: boolean;
  optional?: boolean;
  help?: string;
}) {
  if (!error && !description && !mandatory && !optional && !help) return null;

  return (
    <div
      className={cn("flex items-start justify-between gap-2", className)}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1 justify-between">
          {error ? (
            <FieldDescription className="text-destructive flex items-baseline gap-1">
              <LuTriangleAlert
                className="mt-0.75 size-2.5 shrink-0"
                aria-hidden
              />
              {error.message}
            </FieldDescription>
          ) : (
            <FieldDescription>{description || " "}</FieldDescription>
          )}
          {(mandatory || optional || help) && (
            <div className="flex gap-1">
              {(mandatory || optional) && (
                <SimpleBadge variant="secondary" size="tiny" className="mt-0.5">
                  {mandatory ? "Mandatory" : "Optional"}
                </SimpleBadge>
              )}
              {help && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SimpleBadge
                      variant="secondary"
                      size="tiny"
                      className="mt-0.5 cursor-default"
                    >
                      ?
                    </SimpleBadge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{help}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export {
  Field,
  FieldLabel,
  FieldLabelGroup,
  FieldInfo,
  FieldDescription,
  FieldError,
  FieldHint,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldGrid,
  FieldContent,
  FieldTitle,
};
