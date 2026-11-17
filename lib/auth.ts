import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USER_COOKIE } from "@/lib/constants";
import { createSupabaseClient, getSupabaseConfig } from "@/lib/supabase";
import type { User } from "@/lib/types";

export async function getCurrentUser(): Promise<User | null> {
  const userId = cookies().get(USER_COOKIE)?.value;
  if (!userId || !getSupabaseConfig()) {
    return null;
  }

  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", userId)
    .maybeSingle();

  return data;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
