"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
} from "lucide-react";
import { cn } from "@/ascendra-ui/shadcn";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-primary/15 text-primary hover:bg-primary/20"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something…",
  readOnly = false,
  minHeight = 120,
  maxHeight = 136,
  className,
}: RichTextEditorProps) {
  const [activeMarks, setActiveMarks] = React.useState({
    bold: false,
    italic: false,
    strike: false,
    bulletList: false,
    orderedList: false,
    link: false,
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline underline-offset-2" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value ?? "",
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    const sync = () =>
      setActiveMarks({
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        strike: editor.isActive("strike"),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
        link: editor.isActive("link"),
      });
    editor.on("transaction", sync);
    return () => {
      editor.off("transaction", sync);
    };
  }, [editor]);

  function handleLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Enter URL", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  }

  return (
    <div
      className={cn(
        "rounded-[.375rem] overflow-hidden transition-all",
        "ring-1 ring-(--color-umbra)/12 dark:ring-(--color-gray-1000)/88 dark:ring-inset",
        "shadow-[0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04)]",
        "dark:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24)]",
        "[&:focus-within:not(:has(*:focus-visible))]:shadow-[0_0_0_3px_rgba(0,0,0,0.08),0_4px_4px_-1px_rgba(0,0,0,0.08),0_4px_4px_-2px_rgba(0,0,0,0.04)] [&:focus-within:not(:has(*:focus-visible))]:ring-1 [&:focus-within:not(:has(*:focus-visible))]:ring-(--color-umbra)/12",
        "dark:[&:focus-within:not(:has(*:focus-visible))]:shadow-[0_0_0_3px_rgba(61,61,74,0.4),0_4px_4px_-1px_rgba(0,0,0,0.08),0_4px_4px_-2px_rgba(0,0,0,0.16)] dark:[&:focus-within:not(:has(*:focus-visible))]:ring-black/88",
        "has-focus-visible:outline-2 has-focus-visible:outline-primary has-focus-visible:outline-offset-1",
        "bg-white dark:bg-secondary",
        readOnly &&
          "bg-gray-100 dark:bg-white/5 ring-gray-300 dark:ring-white/10 shadow-none",
        className,
      )}
    >
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-0.5 border-b bg-muted/40 px-2 py-1.5">
          {/* Text format group */}
          <ToolbarButton
            title="Bold"
            active={activeMarks.bold}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor?.can().toggleBold()}
          >
            <Bold className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={activeMarks.italic}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor?.can().toggleItalic()}
          >
            <Italic className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Strikethrough"
            active={activeMarks.strike}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            disabled={!editor?.can().toggleStrike()}
          >
            <Strikethrough className="size-3.5" />
          </ToolbarButton>

          {/* Divider */}
          <div className="mx-1 h-4 w-px bg-border" />

          {/* List group */}
          <ToolbarButton
            title="Bulleted list"
            active={activeMarks.bulletList}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            active={activeMarks.orderedList}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-3.5" />
          </ToolbarButton>

          {/* Divider */}
          <div className="mx-1 h-4 w-px bg-border" />

          {/* Link */}
          <ToolbarButton
            title="Link"
            active={activeMarks.link}
            onClick={handleLink}
          >
            <Link2 className="size-3.5" />
          </ToolbarButton>
        </div>
      )}

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className={cn(
          "px-3 py-2 text-sm text-foreground outline-none overflow-y-auto",
          "[&_.tiptap]:outline-none [&_.tiptap]:min-h-[var(--rte-min-height)]",
          "[&_.tiptap_p]:my-0 [&_.tiptap_p+p]:mt-1.5",
          "[&_.tiptap_ul]:my-1 [&_.tiptap_ul]:pl-5 [&_.tiptap_ul]:list-disc",
          "[&_.tiptap_ol]:my-1 [&_.tiptap_ol]:pl-5 [&_.tiptap_ol]:list-decimal",
          "[&_.tiptap_li]:my-0.5",
          "[&_.tiptap_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.tiptap_.is-editor-empty:first-child::before]:float-left",
          "[&_.tiptap_.is-editor-empty:first-child::before]:h-0",
          "[&_.tiptap_.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.tiptap_.is-editor-empty:first-child::before]:text-muted-foreground",
        )}
        style={
          {
            "--rte-min-height": `${minHeight}px`,
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
