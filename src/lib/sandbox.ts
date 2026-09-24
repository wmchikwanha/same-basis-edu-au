import { supabase } from "@/integrations/supabase/client";
import { PENDING_AI_CONSENT_KEY } from "@/lib/app-state";

export type SandboxRole = "teacher" | "admin";
export const SANDBOX_ROLE_KEY = "samebasis.sandboxRole";

/**
 * Sandbox-only: opens a fresh, private trial account for the chosen role with no
 * form, email or verification. The role only changes which screens are shown —
 * it grants no extra data access (every account still only sees its own data).
 */
export async function enterSandbox(role: SandboxRole) {
  await supabase.auth.signOut();
  const id = crypto.randomUUID().slice(0, 8);
  const email = `${role}-${id}@samebasis-sandbox.test`;
  const password = crypto.randomUUID();
  const fullName = role === "admin" ? "Sandbox Admin" : "Sandbox Teacher";
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, sandbox_role: role } },
  });
  if (error) throw error;
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
    if (e2) throw e2;
  }
  sessionStorage.setItem(PENDING_AI_CONSENT_KEY, "1");
  localStorage.setItem(SANDBOX_ROLE_KEY, role);
}

export function useSandboxRoleValue(): SandboxRole {
  if (typeof window === "undefined") return "teacher";
  return localStorage.getItem(SANDBOX_ROLE_KEY) === "admin" ? "admin" : "teacher";
}
