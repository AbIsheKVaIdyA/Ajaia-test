import type { JSONContent } from "@tiptap/react";
import { canAccess } from "@/lib/access";
import { toUserMessage } from "@/lib/errors";
import { createSupabaseClient } from "@/lib/supabase";
import type { DocumentRecord, SharePerson } from "@/lib/types";

export const TITLE_MAX = 200;

export const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function validateTitle(title: string): string | null {
  const trimmed = title.trim();

  if (!trimmed) {
    return "Title cannot be empty.";
  }

  if (trimmed.length > TITLE_MAX) {
    return "Title must be 200 characters or fewer.";
  }

  return null;
}

export function asTiptapContent(content: unknown): JSONContent {
  if (
    content &&
    typeof content === "object" &&
    "type" in content &&
    (content as { type: unknown }).type === "doc"
  ) {
    return content as JSONContent;
  }

  return EMPTY_DOC;
}

export type DocumentAccess =
  | { ok: true; document: DocumentRecord }
  | { ok: false; reason: "denied" | "error"; message: string };

export async function getAccessibleDocument(
  documentId: string,
  userId: string
): Promise<DocumentAccess> {
  const supabase = createSupabaseClient();

  const [documentResult, shareResult] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, content, owner_id, created_at, updated_at")
      .eq("id", documentId)
      .maybeSingle(),
    supabase
      .from("document_shares")
      .select("document_id")
      .eq("document_id", documentId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (documentResult.error) {
    return {
      ok: false,
      reason: "error",
      message: toUserMessage(documentResult.error),
    };
  }

  if (shareResult.error) {
    return {
      ok: false,
      reason: "error",
      message: toUserMessage(shareResult.error),
    };
  }

  const document = documentResult.data as DocumentRecord | null;

  const allowed = canAccess(userId, documentId, {
    ownerId: document?.owner_id ?? null,
    shares: shareResult.data
      ? [{ document_id: documentId, user_id: userId }]
      : [],
  });

  if (!document || !allowed) {
    return {
      ok: false,
      reason: "denied",
      message: "You don't have access",
    };
  }

  return { ok: true, document };
}

export async function getUserName(userId: string): Promise<string | null> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data?.name ?? null;
}

export async function listDocumentShares(
  documentId: string
): Promise<{ ok: true; shares: SharePerson[] } | { ok: false; error: string }> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("document_shares")
    .select("user_id, users ( id, name, email )")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, error: toUserMessage(error) };
  }

  type ShareRow = {
    user_id: string;
    users: SharePerson | SharePerson[] | null;
  };

  const shares = ((data ?? []) as ShareRow[])
    .map((row) => {
      const person = Array.isArray(row.users) ? row.users[0] : row.users;
      if (!person) {
        return null;
      }
      return {
        id: person.id,
        name: person.name,
        email: person.email,
      };
    })
    .filter((person): person is SharePerson => Boolean(person));

  return { ok: true, shares };
}
