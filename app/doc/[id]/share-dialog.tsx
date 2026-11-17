"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { shareDocument, unshareDocument } from "@/app/actions";
import type { SharePerson } from "@/lib/types";

type ShareDialogProps = {
  documentId: string;
  initialShares: SharePerson[];
};

export function ShareDialog({ documentId, initialShares }: ShareDialogProps) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [shares, setShares] = useState(initialShares);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function onShare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSharing(true);
    setError(null);

    const result = await shareDocument(documentId, email);

    setSharing(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setShares((current) =>
      current.some((person) => person.id === result.person.id)
        ? current
        : [...current, result.person]
    );
    setEmail("");
  }

  async function onRemove(userId: string) {
    setRemovingId(userId);
    setError(null);

    const result = await unshareDocument(documentId, userId);

    setRemovingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setShares((current) => current.filter((person) => person.id !== userId));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
      >
        Share
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close share dialog"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-md rounded-lg bg-white p-5 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                Share document
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-neutral-500 hover:text-neutral-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={onShare} className="mt-4 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                autoFocus
                className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
              <button
                type="submit"
                disabled={sharing}
                className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                {sharing ? "Sharing..." : "Share"}
              </button>
            </form>

            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

            <h3 className="mt-5 text-sm font-medium text-neutral-700">
              People with access
            </h3>
            {shares.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">
                No one else has access yet.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-neutral-200">
                {shares.map((person) => (
                  <li
                    key={person.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{person.name}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {person.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={removingId === person.id}
                      onClick={() => void onRemove(person.id)}
                      className="shrink-0 text-sm text-red-700 hover:underline disabled:opacity-60"
                    >
                      {removingId === person.id ? "Removing..." : "Remove"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
