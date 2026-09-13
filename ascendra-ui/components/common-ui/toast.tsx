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
            "border-positive/20! bg-positive/5! text-positive! dark:bg-positive/10!",
          error:
            "border-negative/20! bg-negative/5! text-negative! dark:bg-negative/10!",
          warning:
            "border-warning/20! bg-warning/5! text-warning! dark:bg-warning/10!",
          info: "border-info/20! bg-info/5! text-info! dark:bg-info/10!",
          loading: "border-border! bg-background! text-foreground!",
        },
      }}
    />
  );
}
