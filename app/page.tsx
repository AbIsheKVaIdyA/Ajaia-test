import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/actions";
import { ImportFileButton } from "@/components/import-file-button";
import { NewDocumentButton } from "@/components/new-document-button";
import { requireUser } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase";
import type { HomeDocument } from "@/lib/types";

type HomeProps = {
  searchParams: { tab?: string };
};

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function Home({ searchParams }: HomeProps) {
  const user = await requireUser();
  const tab = searchParams.tab === "shared" ? "shared" : "mine";
  const supabase = createSupabaseClient();

  let documents: HomeDocument[] = [];

  if (tab === "mine") {
    const { data } = await supabase
      .from("documents")
      .select("id, title, created_at, updated_at")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    documents = (data ?? []).map((doc) => ({
      ...doc,
      kind: "owned" as const,
      ownerName: user.name,
    }));
  } else {
    const { data } = await supabase
      .from("document_shares")
      .select("documents ( id, title, created_at, updated_at, owner_id )")
      .eq("user_id", user.id);

    type SharedDoc = {
      id: string;
      title: string;
      created_at: string;
      updated_at: string;
      owner_id: string;
    };

    type ShareRow = {
      documents: SharedDoc | SharedDoc[] | null;
    };

    const sharedDocs = ((data ?? []) as ShareRow[])
      .map((row) => {
        const shared = row.documents;
        if (Array.isArray(shared)) {
          return shared[0] ?? null;
        }
        return shared;
      })
      .filter((doc): doc is SharedDoc => Boolean(doc));

    const ownerIds = Array.from(
      new Set(sharedDocs.map((doc) => doc.owner_id))
    );
    const { data: owners } =
      ownerIds.length > 0
        ? await supabase.from("users").select("id, name").in("id", ownerIds)
        : { data: [] as { id: string; name: string }[] };

    const ownerNames = new Map(
      (owners ?? []).map((owner) => [owner.id, owner.name])
    );

    documents = sharedDocs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      kind: "shared" as const,
      ownerName: ownerNames.get(doc.owner_id) ?? null,
    }));
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-semibold tracking-tight">ajaia-docs</p>
            <p className="text-sm text-neutral-500">Signed in as {user.name}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-neutral-600 underline-offset-4 hover:underline"
            >
              Switch user
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <nav className="flex gap-1 rounded-lg bg-neutral-100 p-1 text-sm">
            <TabLink href="/" active={tab === "mine"}>
              My documents
            </TabLink>
            <TabLink href="/?tab=shared" active={tab === "shared"}>
              Shared with me
            </TabLink>
          </nav>

          <div className="flex items-start gap-3">
            <NewDocumentButton />
            <ImportFileButton />
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
            <p className="text-sm text-neutral-500">
              {tab === "mine"
                ? "No documents yet"
                : "Nothing shared with you yet"}
            </p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/doc/${doc.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-50"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{doc.title}</span>
                    <KindBadge kind={doc.kind} />
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-sm text-neutral-500">
                    {doc.kind === "shared" && doc.ownerName ? (
                      <span>{doc.ownerName}</span>
                    ) : null}
                    <span>{formatDate(doc.updated_at)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function KindBadge({ kind }: { kind: "owned" | "shared" }) {
  return (
    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
      {kind === "owned" ? "Owned" : "Shared"}
    </span>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-md bg-white px-3 py-1.5 font-medium text-neutral-900 shadow-sm"
          : "rounded-md px-3 py-1.5 text-neutral-600 hover:text-neutral-900"
      }
    >
      {children}
    </Link>
  );
}
