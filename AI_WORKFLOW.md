# AI Workflow Note

## Tools used
- **Cursor (Agent mode)** for code generation, refactors and running tests and builds.
- **A chat assistant** to help plan scope, sequence the work into small prompts and review tradeoffs.

## How I worked
I broke the build into five scoped prompts (scaffold and schema, editor, sharing, import, polish), each with explicit requirements, validation rules and "do not add other features" limits. After each step I tested the flow in the browser before moving on.

## Where AI materially sped things up
- Scaffolding the Next.js app, schema, seed data and mocked login in minutes
- Wiring the Tiptap toolbar and debounced autosave
- Writing the share modal error states and the import conversion logic
- Generating unit tests for the access and conversion helpers

## What I changed, rejected or corrected
- Cursor noticed my new Supabase project issues a **publishable key** (`sb_publishable_...`) rather than the legacy anon JWT; I verified this in the Supabase dashboard before accepting the switch.
- I reviewed the generated `schema.sql`: the RLS policies are fully permissive for the anon role. I kept them only because auth is mocked, made sure every access check runs server-side, and documented the production fix (Supabase Auth plus per-user RLS).
- I asked for the access logic to live in one module (`lib/access.ts`) so it could be unit tested instead of scattered across components.
- I constrained scope myself: .txt/.md only (no .docx), no real-time editing, one stretch feature (Markdown export).

## How I verified correctness and quality
- 18 unit tests passing (`npm test`) covering access control, import conversion and Markdown export
- `npm run build` clean with no type errors
- Manual browser checks: formatting survives refresh, Alice to Bob sharing works, Carol is denied, owner-only share controls, Markdown import keeps headings and lists, error states for bad files and emails
- Re-tested the sharing flow on the live Vercel deployment
