"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { importDocument } from "@/app/actions";
import { validateImportFile } from "@/lib/import-file";

export function ImportFileButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const localError = validateImportFile(file);
    if (localError) {
      setError(localError);
      return;
    }

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await importDocument(formData);

    setPending(false);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          className="sr-only"
          onChange={onFileChange}
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
        >
          {pending ? "Importing..." : "Import file"}
        </button>
        <span className="text-sm text-neutral-500">Supported: .txt, .md</span>
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
