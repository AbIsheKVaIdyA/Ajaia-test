"use client";

import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { updateDocument } from "@/app/actions";
import { EditorToolbar } from "@/app/doc/[id]/toolbar";
import { ShareDialog } from "@/app/doc/[id]/share-dialog";
import { isOwner } from "@/lib/access";
import {
  asTiptapContent,
  TITLE_MAX,
  validateTitle,
} from "@/lib/documents";
import { filenameFromTitle, tiptapToMarkdown } from "@/lib/export-markdown";
import type { DocumentRecord, SharePerson } from "@/lib/types";

type SaveStatus = "saved" | "saving" | "failed";

export function DocumentEditor({
  document,
  currentUserId,
  ownerName,
  shares,
}: {
  document: DocumentRecord;
  currentUserId: string;
  ownerName: string;
  shares: SharePerson[];
}) {
  const owned = isOwner(currentUserId, document.owner_id);
  const initialContent = asTiptapContent(document.content);
  const [title, setTitle] = useState(document.title);
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef(document.title);
  const contentRef = useRef(initialContent);
  const saveGeneration = useRef(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        underline: false,
        heading: { levels: [1, 2] },
      }),
      Underline,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "tiptap",
      },
    },
    onUpdate: ({ editor: instance }) => {
      contentRef.current = instance.getJSON();
      setRevision((current) => current + 1);
    },
  });

  useEffect(() => {
    if (revision === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void save();
    }, 1000);

    return () => window.clearTimeout(timeout);

    async function save() {
      const titleError = validateTitle(titleRef.current);
      if (titleError) {
        setStatus("failed");
        setError(titleError);
        return;
      }

      const generation = ++saveGeneration.current;
      setStatus("saving");
      setError(null);

      try {
        const result = await updateDocument({
          id: document.id,
          title: titleRef.current.trim(),
          content: JSON.parse(JSON.stringify(contentRef.current)),
        });

        if (generation !== saveGeneration.current) {
          return;
        }

        if (result.ok) {
          setStatus("saved");
          setError(null);
          return;
        }

        setStatus("failed");
        setError(result.error);
      } catch {
        if (generation !== saveGeneration.current) {
          return;
        }

        setStatus("failed");
        setError("Could not save this document. Please try again.");
      }
    }
  }, [document.id, revision]);

  function exportToMarkdown() {
    const content = editor?.getJSON() ?? contentRef.current;
    const markdown = tiptapToMarkdown(content);
    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${filenameFromTitle(titleRef.current)}.md`;
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
          <Link
            href="/"
            className="text-sm text-neutral-600 underline-offset-4 hover:underline"
          >
            All documents
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!editor}
              onClick={exportToMarkdown}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
            >
              Export to Markdown
            </button>
            {owned ? (
              <ShareDialog documentId={document.id} initialShares={shares} />
            ) : (
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                Shared by {ownerName}
              </span>
            )}
            <p className="text-sm text-neutral-500" aria-live="polite">
              {status === "saving"
                ? "Saving..."
                : status === "failed"
                  ? "Save failed"
                  : "Saved"}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-6">
        <input
          aria-label="Document title"
          value={title}
          maxLength={TITLE_MAX}
          onChange={(event) => {
            const nextTitle = event.target.value;
            titleRef.current = nextTitle;
            setTitle(nextTitle);
            setRevision((current) => current + 1);
          }}
          className="w-full border-none bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-neutral-400"
          placeholder="Untitled document"
        />
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {editor ? <EditorToolbar editor={editor} /> : null}
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <p className="px-4 py-6 text-sm text-neutral-500">Loading editor...</p>
          )}
        </div>
      </main>
    </div>
  );
}
