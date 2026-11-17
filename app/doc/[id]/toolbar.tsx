"use client";

import { type Editor, useEditorState } from "@tiptap/react";

type ToolbarButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function ToolbarButton({ label, active, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={
        active
          ? "rounded-md bg-neutral-900 px-2.5 py-1 text-sm font-medium text-white"
          : "rounded-md px-2.5 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
      }
    >
      {label}
    </button>
  );
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const marks = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      bold: instance.isActive("bold"),
      italic: instance.isActive("italic"),
      underline: instance.isActive("underline"),
      h1: instance.isActive("heading", { level: 1 }),
      h2: instance.isActive("heading", { level: 2 }),
      bullet: instance.isActive("bulletList"),
      numbered: instance.isActive("orderedList"),
    }),
  });

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="flex flex-wrap gap-1 border-b border-neutral-200 px-3 py-2"
    >
      <ToolbarButton
        label="Bold"
        active={marks.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Italic"
        active={marks.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Underline"
        active={marks.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        label="H1"
        active={marks.h1}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        label="H2"
        active={marks.h2}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="Bullet list"
        active={marks.bullet}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="Numbered list"
        active={marks.numbered}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
    </div>
  );
}
