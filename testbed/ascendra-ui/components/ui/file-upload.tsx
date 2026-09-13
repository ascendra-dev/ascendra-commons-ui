"use client";

import * as React from "react";
import { Upload, X, FileIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/ascendra-ui/shadcn";
import { ProgressBar } from "./progress";
import { Button } from "./button";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FileUploadVariant = "dropzone" | "button" | "inline";
export type FileUploadState = "idle" | "dragover" | "uploading" | "success" | "error";

export interface FileUploadFile {
  file: File;
  progress?: number;
  error?: string;
}

export interface FileUploadProps {
  variant?: FileUploadVariant;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  uploadProgress?: number;
  state?: FileUploadState;
  errorMessage?: string;
  onFiles?: (files: File[]) => void;
  className?: string;
  // Dropzone variant, `state="success"` only: overrides the filename text
  // that would otherwise be read from the locally-selected `File` object —
  // needed when success reflects server-confirmed state on mount (no local
  // File object exists yet, e.g. after a page reload). Falls back to the
  // existing file-based text when omitted.
  successLabel?: string;
  // Dropzone variant, `state="success"` only: renders a "Download" action
  // alongside "Upload another" — click stops propagation so it never also
  // opens the file picker underneath. Always shown when `isSuccess`,
  // regardless of `disabled` — viewing an already-uploaded document should
  // stay possible even while new uploads are blocked.
  onSuccessDownload?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFiles(files: File[], accept?: string, maxSize?: number) {
  const errors: string[] = [];
  files.forEach((file) => {
    if (maxSize && file.size > maxSize) {
      errors.push(`${file.name} exceeds max size of ${formatSize(maxSize)}.`);
    }
    if (accept) {
      const accepted = accept.split(",").map((a) => a.trim());
      const match = accepted.some((a) => {
        if (a.startsWith(".")) return file.name.endsWith(a);
        if (a.endsWith("/*")) return file.type.startsWith(a.replace("/*", ""));
        return file.type === a;
      });
      if (!match) errors.push(`${file.name} is not an accepted file type.`);
    }
  });
  return errors;
}

// ─── Dropzone variant ─────────────────────────────────────────────────────────

function FileUploadDropzone({
  accept,
  maxSize,
  multiple,
  disabled,
  uploadProgress,
  state: controlledState,
  errorMessage: controlledError,
  onFiles,
  className,
  successLabel,
  onSuccessDownload,
}: Omit<FileUploadProps, "variant">) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [state, setState] = React.useState<FileUploadState>(controlledState ?? "idle");
  const [files, setFiles] = React.useState<File[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const effectiveState = controlledState ?? state;
  const effectiveError = controlledError ?? error;

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const errs = validateFiles(arr, accept, maxSize);
    if (errs.length) {
      setState("error");
      setError(errs[0]);
      return;
    }
    setFiles(arr);
    setError(null);
    setState("idle");
    onFiles?.(arr);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (disabled) return;
    setState("idle");
    handleFiles(e.dataTransfer.files);
  }

  function handleReset() {
    setState("idle");
    setFiles([]);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const isDragover = effectiveState === "dragover";
  const isSuccess = effectiveState === "success";
  const isError = effectiveState === "error";
  const isUploading = effectiveState === "uploading";

  return (
    <div className={cn("flex h-full flex-col gap-2", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setState("dragover"); }}
        onDragLeave={() => setState("idle")}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        className={cn(
          "relative flex h-full cursor-pointer flex-col items-center justify-start gap-3 rounded-xl border border-dashed p-8 text-center transition-all duration-150 outline-none",
          "bg-white dark:bg-transparent",
          // Idle
          !isDragover && !isSuccess && !isError && "border-border dark:border-foreground/15 hover:border-foreground/40 dark:hover:border-foreground/30 hover:bg-muted/30 focus-visible:border-primary",
          // Dragover
          isDragover && "border-primary bg-primary/5 scale-[1.01]",
          // Success
          isSuccess && "border-emerald-500/50 bg-emerald-500/5",
          // Error
          isError && "border-destructive/50 bg-destructive/5",
          // Disabled — cursor always reflects real clickability, regardless
          // of state (CSS `cursor` is a normal overridable property, unlike
          // `opacity`). Opacity dimming moves to a wrapper below scoped to
          // just the icon/label — CSS opacity multiplies through descendants
          // with no way for a child to opt back out, so it can't sit on this
          // outer box without also fading Download, which must stay legible.
          disabled && "cursor-not-allowed",
        )}
      >
        <div
          className={cn(
            "flex flex-col items-center gap-3",
            disabled && "opacity-50",
          )}
        >
          {isSuccess ? (
            <CheckCircle2 className="size-8 text-emerald-500" />
          ) : isError ? (
            <AlertCircle className="size-8 text-destructive" />
          ) : (
            <div className={cn(
              "flex size-12 items-center justify-center rounded-lg ring-1 ring-inset transition-colors",
              isDragover ? "ring-primary/40 bg-primary/10 text-primary" : "ring-border bg-gray-700/4 text-foreground",
            )}>
              <Upload className="size-5" />
            </div>
          )}

          <div className="flex flex-col gap-1">
            {isSuccess ? (
              <>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {successLabel ??
                    (files.length === 1
                      ? files[0].name
                      : `${files.length} files uploaded`)}
                </p>
                <p className="text-xs text-muted-foreground">Upload complete</p>
              </>
            ) : isError ? (
              <>
                <p className="text-sm font-medium text-destructive">Upload failed</p>
                <p className="text-xs text-destructive/80">{effectiveError}</p>
              </>
            ) : isDragover ? (
              <p className="text-sm font-medium text-primary">Drop to upload</p>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">
                  <span className="text-primary">Click to browse</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  {accept ? accept.split(",").join(", ") : "Any file type"}
                  {maxSize ? ` · max ${formatSize(maxSize)}` : ""}
                  {multiple ? " · multiple files allowed" : ""}
                </p>
              </>
            )}
          </div>
        </div>

        {isUploading && (
          <div className="w-full max-w-xs flex flex-col gap-1.5">
            <ProgressBar value={uploadProgress} indeterminate={uploadProgress === undefined} size="sm" />
            <p className="text-[0.6875rem] text-muted-foreground text-center">
              {uploadProgress !== undefined ? `${uploadProgress}%` : "Uploading…"}
            </p>
          </div>
        )}

        {isSuccess && onSuccessDownload && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSuccessDownload(); }}
            className="cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Download
          </button>
        )}

        {/* "Upload another"/"Try again" both re-open the file picker directly
            rather than relying on handleReset() alone — a consumer that
            passes a controlled `state` prop (e.g. always "success" while a
            server-confirmed file exists) would otherwise make handleReset()
            invisible, since effectiveState still reads from the controlled
            prop on the very next render. Opening the picker works
            unconditionally in both controlled and uncontrolled usage: a real
            file selection always flows through onFiles, which is what
            actually drives a controlled consumer's next state. */}
        {((isSuccess && !disabled) || isError) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
              inputRef.current?.click();
            }}
            className="cursor-pointer text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {isError ? "Try again" : "Upload another"}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}

// ─── Button variant ───────────────────────────────────────────────────────────

function FileUploadButton({
  accept,
  maxSize,
  multiple,
  disabled,
  state: controlledState,
  errorMessage: controlledError,
  onFiles,
  className,
}: Omit<FileUploadProps, "variant">) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const effectiveError = controlledError ?? error;
  const effectiveState = controlledState;

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const errs = validateFiles(arr, accept, maxSize);
    if (errs.length) { setError(errs[0]); return; }
    setFiles(arr);
    setError(null);
    onFiles?.(arr);
  }

  const isSuccess = effectiveState === "success" || files.length > 0;
  const isError = !!effectiveError;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className={cn(isError && "ring-destructive ring-2")}
        >
          <Upload className="size-3.5 text-muted-foreground" />
          Choose file{multiple ? "s" : ""}
        </Button>

        <span className="text-sm text-muted-foreground">
          {isSuccess
            ? files.length === 1
              ? files[0].name
              : `${files.length} files selected`
            : "No file chosen"}
        </span>

        {isSuccess && (
          <button
            type="button"
            onClick={() => { setFiles([]); if (inputRef.current) inputRef.current.value = ""; }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear selection"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {isError && (
        <p className="text-xs text-destructive">{effectiveError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ─── Inline variant ───────────────────────────────────────────────────────────

function FileUploadInline({
  accept,
  maxSize,
  multiple,
  disabled,
  state: controlledState,
  errorMessage: controlledError,
  onFiles,
  className,
}: Omit<FileUploadProps, "variant">) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const effectiveError = controlledError ?? error;

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const errs = validateFiles(arr, accept, maxSize);
    if (errs.length) { setError(errs[0]); return; }
    setFiles(arr);
    setError(null);
    onFiles?.(arr);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const isError = !!effectiveError || controlledState === "error";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        className={cn(
          "flex min-h-8 flex-wrap items-center gap-1.5 rounded-[.375rem] px-2 py-1",
          "bg-white dark:bg-secondary",
          "ring-1 ring-(--color-umbra)/12 dark:ring-(--color-gray-1000)/88 dark:ring-inset",
          "shadow-[0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04)]",
          "dark:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24)]",
          "transition-all",
          isError && "ring-2 ring-destructive",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {files.map((f, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs"
          >
            <FileIcon className="size-3 text-muted-foreground shrink-0" />
            <span className="max-w-30 truncate">{f.name}</span>
            <button
              type="button"
              onClick={() => removeFile(i)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${f.name}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:cursor-not-allowed"
        >
          <Upload className="size-3" />
          {files.length === 0 ? `Add file${multiple ? "s" : ""}` : "Add more"}
        </button>
      </div>

      {isError && (
        <p className="text-xs text-destructive">{effectiveError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function FileUpload({ variant = "dropzone", ...props }: FileUploadProps) {
  if (variant === "button") return <FileUploadButton {...props} />;
  if (variant === "inline") return <FileUploadInline {...props} />;
  return <FileUploadDropzone {...props} />;
}
