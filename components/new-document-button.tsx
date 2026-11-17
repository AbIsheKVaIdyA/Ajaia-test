"use client";

import { useState } from "react";
import { createDocument } from "@/app/actions";

export function NewDocumentButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <form
        action={async () => {
          setPending(true);
          setError(null);
          const result = await createDocument();
          setPending(false);
          if (result?.error) {
            setError(result.error);
          }
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? "Creating..." : "New document"}
        </button>
      </form>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
