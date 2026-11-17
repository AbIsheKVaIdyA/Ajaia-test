import Link from "next/link";
import { DocumentEditor } from "@/app/doc/[id]/document-editor";
import { isOwner } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import {
  getAccessibleDocument,
  getUserName,
  listDocumentShares,
} from "@/lib/documents";

type DocPageProps = {
  params: { id: string };
};

export default async function DocPage({ params }: DocPageProps) {
  const user = await requireUser();
  const result = await getAccessibleDocument(params.id, user.id);

  if (!result.ok && result.reason === "error") {
    return (
      <AccessMessage
        title="Couldn't load this document"
        body={result.message}
      />
    );
  }

  if (!result.ok) {
    return (
      <AccessMessage
        title="You don't have access"
        body="This document is private, or it does not exist."
      />
    );
  }

  const owned = isOwner(user.id, result.document.owner_id);
  const [ownerName, shareResult] = await Promise.all([
    owned ? Promise.resolve(user.name) : getUserName(result.document.owner_id),
    owned ? listDocumentShares(result.document.id) : Promise.resolve(null),
  ]);

  return (
    <DocumentEditor
      document={result.document}
      currentUserId={user.id}
      ownerName={ownerName ?? "Unknown"}
      shares={shareResult?.ok ? shareResult.shares : []}
    />
  );
}

function AccessMessage({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-neutral-600">{body}</p>
      <Link
        href="/"
        className="mt-6 text-sm font-medium text-neutral-900 underline-offset-4 hover:underline"
      >
        Back to documents
      </Link>
    </main>
  );
}
