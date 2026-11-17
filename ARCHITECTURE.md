# Architecture Note

## Goal and prioritization
With a 4 to 6 hour timebox I prioritized depth in the four required surfaces (editing, persistence, sharing, import) and a deployed, testable build over breadth. Order of work: scaffold and data model, editor and autosave, sharing and access control, import, polish and tests, deploy, docs.

## Stack choices
- **Next.js 14 App Router + TypeScript:** one codebase for UI and server logic (server components and server actions), easy Vercel deploy.
- **Tiptap:** mature ProseMirror-based editor; gives bold/italic/underline/headings/lists with little custom code, and a clean JSON document model.
- **Supabase Postgres:** free, hosted, relational. Sharing is naturally a join table.
- **Vitest:** fast unit tests for pure logic.

## Data model
- `users(id, name, email)`: three seeded demo users
- `documents(id, owner_id, title, content jsonb, created_at, updated_at)`: content stored as Tiptap JSON so structure and formatting round-trip exactly; `updated_at` maintained by trigger
- `document_shares(document_id, user_id, created_at)`: composite primary key prevents duplicate shares; cascade deletes

## Access control
- Auth is **mocked**: `/login` sets an httpOnly cookie with the selected user id. This kept scope on the product, not identity.
- All authorization is enforced **server-side** in app code. `lib/access.ts` exposes `canAccess` (owner or shared) and `isOwner`, used by the document page and the share/remove actions. Only owners can share or revoke; this is checked on the server, not just hidden in the UI.
- Known tradeoff: because there is no Supabase Auth, the database RLS policies allow the anon role, so the database itself does not enforce per-user access. For production I would add Supabase Auth and per-user RLS policies (owner or row in `document_shares`).

## Editing and persistence
- Debounced autosave (1s) with visible Saving / Saved / Save failed status.
- Title validated (non-empty, max 200 chars).

## File import
- `.txt` and `.md` only, max 1 MB, parsed on the server. Markdown goes through `marked` and becomes Tiptap content (headings, emphasis, lists preserved); text becomes paragraphs split on blank lines. A new document is created and opened.
- `.docx` was deliberately cut: it needs a heavier parser and offers little extra signal for this exercise.

## What I would build next (2 to 4 more hours)
1. Real auth (Supabase Auth or magic link) plus per-user RLS
2. Viewer vs editor roles on shares
3. Real-time presence and co-editing (Supabase Realtime or Yjs)
4. Version history with restore
5. `.docx` import and PDF export
