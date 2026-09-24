import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;

export interface GovernanceInput {
  category: "ai" | "admin" | "consent" | "equity" | "data";
  eventType: string;
  summary: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Append-only governance log write. The table rejects UPDATE/DELETE at the
 * database level, so nobody (admins included) can alter the record later.
 * Failures are logged, never thrown — governance logging must not break teaching.
 */
export async function logGovernance(supabase: DB, userId: string, input: GovernanceInput) {
  try {
    const [{ data: schoolId }, { data: profile }] = await Promise.all([
      supabase.rpc("user_school_id", { _user_id: userId }),
      supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    ]);
    const { error } = await supabase.from("governance_events").insert({
      school_id: (schoolId as string | null) ?? null,
      actor_id: userId,
      actor_name: profile?.full_name ?? "",
      category: input.category,
      event_type: input.eventType,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      summary: input.summary.slice(0, 600),
      details: (input.details ?? {}) as Json,
    });
    if (error) console.error("governance log failed", error.message);
  } catch (error) {
    console.error("governance log failed", error);
  }
}
