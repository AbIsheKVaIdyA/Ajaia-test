# Ajaia Docs

A lightweight collaborative document editor inspired by Google Docs, built for the Ajaia AI-Native Full Stack Developer assignment.

**Live app:** https://ajaia-test-tau.vercel.app
**Source:** https://github.com/AbIsheKVaIdyA/Ajaia-test

## Demo accounts (mocked auth, no passwords)

Go to `/login` and pick a user from "Sign in as":

| User  | Email           |
|-------|-----------------|
| Alice | alice@demo.com  |
| Bob   | bob@demo.com    |
| Carol | carol@demo.com  |

Use "Switch user" on the home page to change accounts.

### Try the sharing flow
1. Sign in as **Alice**, create a document, add some formatted text.
2. Click **Share**, enter `bob@demo.com`.
3. Switch to **Bob**: the doc appears under **Shared with me** with a "Shared by Alice" badge. Bob can edit but cannot share.
4. Switch to **Carol** and open the same URL: she sees "You don't have access".

## Features
- Create, rename, edit, autosave (1s debounce) and reopen documents
- Rich text: bold, italic, underline, H1/H2, bulleted and numbered lists (Tiptap)
- Content stored as Tiptap JSON, so formatting survives refresh
- File import: `.txt` and `.md` only, max 1 MB, becomes a new editable document
- Sharing: owner grants or removes access by email; "My documents" vs "Shared with me" with Owned/Shared badges
- Export current document to Markdown (stretch)
- Validation and friendly errors (empty/long titles, unknown email, self-share, duplicate share, bad file type/size)

## Tech stack
Next.js 14 (App Router, TypeScript), Tailwind CSS, Tiptap, Supabase Postgres, `marked`, Vitest. Deployed on Vercel.

## Run locally
Requirements: Node 18+, a free Supabase project.

```bash
git clone https://github.com/AbIsheKVaIdyA/Ajaia-test
cd Ajaia-test
npm install
cp .env.example .env.local   # fill in values below
```

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your sb_publishable_... key>
```

Create the tables and seed users: open the Supabase SQL Editor and run `supabase/schema.sql`.

```bash
npm run dev     # http://localhost:3000
npm test        # unit tests (Vitest)
npm run build   # production build
```

## Tests
`npm test` runs 18 unit tests covering access control (`lib/access.test.ts`), file import conversion (`lib/import-file.test.ts`) and Markdown export (`lib/export-markdown.test.ts`).

## Status
**Working end to end:** create/rename/edit/autosave, rich text, persistence, sharing with owner-only controls, .txt/.md import, Markdown export, deployment.

**Intentionally not built:** real authentication, real-time co-editing, .docx import, comments, version history, role-based permissions (viewer vs editor).

See `ARCHITECTURE.md` and `AI_WORKFLOW.md` for decisions and tradeoffs.
