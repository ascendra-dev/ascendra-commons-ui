"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

export { toast };

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="system"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "font-sans text-xs! rounded-lg! shadow-md! border! bg-background! text-foreground! border-border!",
          title: "font-medium! text-xs!",
          description: "text-muted-foreground! text-xs!",
          actionButton:
            "bg-primary! text-primary-foreground! text-xs! font-medium! rounded-md! px-2! py-1!",
          cancelButton:
            "bg-muted! text-muted-foreground! text-xs! font-medium! rounded-md! px-2! py-1!",
          closeButton:
            "border! border-border! bg-background! text-muted-foreground! hover:text-foreground!",
          success:
            "border-positive/20! bg-linear-to-r! from-positive/5 to-positive/5 text-positive! dark:from-positive/10 dark:to-positive/10",
          error:
            "border-negative/20! bg-linear-to-r! from-negative/5 to-negative/5 text-negative! dark:from-negative/10 dark:to-negative/10",
          warning:
            "border-warning/20! bg-linear-to-r! from-warning/5 to-warning/5 text-warning! dark:from-warning/10 dark:to-warning/10",
          info: "border-info/20! bg-linear-to-r! from-info/5 to-info/5 text-info! dark:from-info/10 dark:to-info/10",
          loading: "border-border! bg-background! text-foreground!",
        },
      }}
    />
  );
}
