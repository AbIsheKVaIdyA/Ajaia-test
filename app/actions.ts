"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isOwner } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { USER_COOKIE } from "@/lib/constants";
import {
  EMPTY_DOC,
  getAccessibleDocument,
  validateTitle,
} from "@/lib/documents";
import {
  fileToTiptapContent,
  titleFromFilename,
  validateImportFile,
} from "@/lib/import-file";
import { toUserMessage } from "@/lib/errors";
import { createSupabaseClient } from "@/lib/supabase";
import type { SharePerson } from "@/lib/types";

export async function signInAs(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const supabase = createSupabaseClient();
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!user) {
    throw new Error("Unknown user");
  }

  cookies().set(USER_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}

export async function signOut() {
  cookies().delete(USER_COOKIE);
  redirect("/login");
}

export async function createDocument(): Promise<{ error: string | null } | void> {
  const user = await requireUser();
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      owner_id: user.id,
      title: "Untitled document",
      content: EMPTY_DOC,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: toUserMessage(error) };
  }

  redirect(`/doc/${data.id}`);
}

export async function importDocument(
  formData: FormData
): Promise<{ error: string } | void> {
  const user = await requireUser();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { error: "Choose a file to import." };
  }

  const fileError = validateImportFile(file);
  if (fileError) {
    return { error: fileError };
  }

  const text = await file.text();
  if (!text.trim()) {
    return { error: "This file is empty." };
  }

  const title = titleFromFilename(file.name);
  const titleError = validateTitle(title);
  if (titleError) {
    return { error: titleError };
  }

  const content = JSON.parse(
    JSON.stringify(fileToTiptapContent(file.name, text))
  );
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      owner_id: user.id,
      title,
      content,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: toUserMessage(error) };
  }

  redirect(`/doc/${data.id}`);
}

export async function updateDocument(input: {
  id: string;
  title: string;
  content: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const titleError = validateTitle(input.title);

  if (titleError) {
    return { ok: false, error: titleError };
  }

  const access = await getAccessibleDocument(input.id, user.id);
  if (!access.ok) {
    return {
      ok: false,
      error:
        access.reason === "denied"
          ? "You don't have access to this document."
          : access.message,
    };
  }

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("documents")
    .update({
      title: input.title.trim(),
      content: input.content,
    })
    .eq("id", access.document.id);

  if (error) {
    return { ok: false, error: toUserMessage(error) };
  }

  return { ok: true };
}

async function requireOwnedDocument(documentId: string, userId: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, owner_id")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: toUserMessage(error) };
  }

  if (!data || !isOwner(userId, data.owner_id)) {
    return {
      ok: false as const,
      error: "Only the owner can share this document.",
    };
  }

  return { ok: true as const, document: data };
}

export async function shareDocument(
  documentId: string,
  email: string
): Promise<{ ok: true; person: SharePerson } | { ok: false; error: string }> {
  const user = await requireUser();
  const owned = await requireOwnedDocument(documentId, user.id);

  if (!owned.ok) {
    return owned;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { ok: false, error: "Enter an email address." };
  }

  const supabase = createSupabaseClient();
  const { data: target, error: userError } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (userError) {
    return { ok: false, error: toUserMessage(userError) };
  }

  if (!target) {
    return { ok: false, error: "No user found with that email." };
  }

  if (isOwner(target.id, owned.document.owner_id)) {
    return { ok: false, error: "You can't share a document with yourself." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("document_shares")
    .select("user_id")
    .eq("document_id", documentId)
    .eq("user_id", target.id)
    .maybeSingle();

  if (existingError) {
    return { ok: false, error: toUserMessage(existingError) };
  }

  if (existing) {
    return { ok: false, error: "This person already has access." };
  }

  const { error: insertError } = await supabase.from("document_shares").insert({
    document_id: documentId,
    user_id: target.id,
  });

  if (insertError) {
    return { ok: false, error: toUserMessage(insertError) };
  }

  return {
    ok: true,
    person: {
      id: target.id,
      name: target.name,
      email: target.email,
    },
  };
}

export async function unshareDocument(
  documentId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const owned = await requireOwnedDocument(documentId, user.id);

  if (!owned.ok) {
    return owned;
  }

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("document_shares")
    .delete()
    .eq("document_id", documentId)
    .eq("user_id", userId);

  if (error) {
    return { ok: false, error: toUserMessage(error) };
  }

  return { ok: true };
}
