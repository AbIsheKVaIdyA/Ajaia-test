import { signInAs } from "@/app/actions";
import { getSupabaseConfig, createSupabaseClient } from "@/lib/supabase";
import type { User } from "@/lib/types";

export default async function LoginPage() {
  const config = getSupabaseConfig();

  if (!config) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold tracking-tight">ajaia-docs</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Add <code className="rounded bg-neutral-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-neutral-100 px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
          to <code className="rounded bg-neutral-100 px-1">.env.local</code>, then run{" "}
          <code className="rounded bg-neutral-100 px-1">supabase/schema.sql</code> in the SQL
          Editor.
        </p>
      </main>
    );
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email")
    .order("name");

  const users = (data ?? []) as User[];

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight">ajaia-docs</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Sign in as a demo user. No password needed.
      </p>

      {error || users.length === 0 ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Could not load users. Run <code>supabase/schema.sql</code> in your
          Supabase project, then refresh.
        </p>
      ) : (
        <form action={signInAs} className="mt-8 flex flex-col gap-3">
          <label htmlFor="userId" className="text-sm font-medium">
            Sign in as
          </label>
          <select
            id="userId"
            name="userId"
            required
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="mt-2 rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Continue
          </button>
        </form>
      )}
    </main>
  );
}
