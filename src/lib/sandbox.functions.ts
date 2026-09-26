import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { seedWorkspace } from "./workspace.server";

const SANDBOX_ADMIN = /^admin-[0-9a-f]{8}@samebasis-sandbox\.test$/;

const TEACHERS = [
  {
    fullName: "Priya Raman",
    role: "Classroom Teacher",
    year: 8,
    className: "Year 8 Science B",
    subject: "Science",
    names: null as null | string[][],
  },
  {
    fullName: "Tom Nguyen",
    role: "Classroom Teacher",
    year: 7,
    className: "Year 7 English A",
    subject: "English",
    names: [
      ["Layla", "Haddad"],
      ["Noah", "Whitfield"],
      ["Minh", "Tran"],
      ["Grace", "O'Connor"],
      ["Samuel", "Deng"],
      ["Ruby", "Patel"],
    ],
  },
  {
    fullName: "Aroha Walker",
    role: "Learning Support Teacher",
    year: 9,
    className: "Year 9 Maths C",
    subject: "Mathematics",
    names: [
      ["Omar", "Farouk"],
      ["Jack", "Morrison"],
      ["Linh", "Pham"],
      ["Chloe", "Bennett"],
      ["Amani", "Kiprop"],
      ["Isla", "Fraser"],
    ],
  },
];

/**
 * Sandbox only: turns a freshly created sandbox admin account into the head of
 * a private synthetic school with three teachers and their classes. Guarded to
 * sandbox admin emails with no existing school, so it cannot be replayed.
 */
export const setupSandboxSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String(context.claims.email ?? "");
    if (!SANDBOX_ADMIN.test(email)) throw new Error("Not a sandbox admin account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("school_members")
      .select("school_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) return { ok: true as const, schoolId: existing.school_id };

    const adminId = context.userId;
    const schoolName = "Main Stream High School (Sandbox)";
    const { data: school, error } = await supabaseAdmin
      .from("schools")
      .insert({ name: schoolName, created_by: adminId })
      .select("id")
      .single();
    if (error || !school) throw new Error("Could not create the sandbox school.");

    await supabaseAdmin.from("school_members").insert({ user_id: adminId, school_id: school.id });
    await supabaseAdmin.from("user_roles").insert({ user_id: adminId, role: "admin" });
    await supabaseAdmin.from("profiles").upsert({
      id: adminId,
      full_name: "Sandbox Head of School",
      role: "Principal / Head of School",
      school_name: schoolName,
      ai_consent: true,
      ai_consent_at: new Date().toISOString(),
    });

    const gov: Array<Record<string, unknown>> = [];
    const suffix = email.slice(6, 14);

    for (const [index, t] of TEACHERS.entries()) {
      const { data: created } = await supabaseAdmin.auth.admin.createUser({
        email: `teacher${index + 1}-${suffix}@samebasis-sandbox.test`,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { full_name: t.fullName },
      });
      const tid = created.user?.id;
      if (!tid) continue;
      await supabaseAdmin.from("school_members").insert({ user_id: tid, school_id: school.id });
      await supabaseAdmin.from("user_roles").insert({ user_id: tid, role: "teacher" });
      await supabaseAdmin.from("profiles").upsert({
        id: tid,
        full_name: t.fullName,
        role: t.role,
        year_level: t.year,
        school_name: schoolName,
        ai_consent: index !== 2,
        ai_consent_at: index !== 2 ? new Date(Date.now() - 20 * 86_400_000).toISOString() : null,
      });
      await seedWorkspace(supabaseAdmin, tid);
      await supabaseAdmin
        .from("classes")
        .update({ name: t.className, year_level: t.year, subject: t.subject })
        .eq("user_id", tid);

      const { data: studs } = await supabaseAdmin
        .from("students")
        .select("id, sort_order, preferred_name")
        .eq("user_id", tid)
        .order("sort_order");
      if (t.names && studs) {
        await Promise.all(
          studs.map((s, i) => {
            const n = t.names?.[i];
            if (!n) return Promise.resolve();
            return supabaseAdmin
              .from("students")
              .update({ first_name: n[0], last_name: n[1], preferred_name: n[0] })
              .eq("id", s.id);
          }),
        );
      }
      const first = studs?.[0]?.id ?? null;
      const second = studs?.[1]?.id ?? null;
      const ago = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

      await supabaseAdmin.from("ai_activity_events").insert([
        { user_id: tid, student_id: first, event_type: "generated", surface: "planner", summary: "Adjustment generated.", duration_ms: 6200 + index * 900, created_at: ago(9) },
        { user_id: tid, student_id: first, event_type: "edited", surface: "planner", summary: "Teacher edited AI output before accepting.", created_at: ago(9) },
        { user_id: tid, student_id: first, event_type: "accepted", surface: "planner", summary: "Accepted and logged as evidence.", created_at: ago(9) },
        { user_id: tid, student_id: second, event_type: "generated", surface: "planner", summary: "Adjustment generated.", duration_ms: 7400, created_at: ago(5) },
        { user_id: tid, student_id: second, event_type: index === 1 ? "declined" : "accepted", surface: "planner", summary: index === 1 ? "Declined — not appropriate for this lesson." : "Accepted and logged as evidence.", created_at: ago(5) },
      ]);
      gov.push(
        { school_id: school.id, actor_id: adminId, actor_name: "Sandbox Head of School", category: "admin", event_type: "teacher_created", target_type: "teacher", target_id: tid, summary: `Created teacher account for ${t.fullName}.`, created_at: ago(21) },
        { school_id: school.id, actor_id: tid, actor_name: t.fullName, category: "ai", event_type: "generated", target_type: "student", target_id: first, summary: "Adjustment generated in Lesson Planner.", created_at: ago(9) },
        { school_id: school.id, actor_id: tid, actor_name: t.fullName, category: "ai", event_type: "accepted", target_type: "student", target_id: first, summary: "Teacher reviewed, edited and accepted AI output.", created_at: ago(9) },
      );
      if (index !== 2) {
        gov.push({ school_id: school.id, actor_id: tid, actor_name: t.fullName, category: "consent", event_type: "consent_given", summary: "AI processing consent given.", created_at: ago(20) });
      }

      if (index === 1 && second) {
        await supabaseAdmin.from("equity_flags").insert({
          school_id: school.id,
          user_id: tid,
          student_id: second,
          surface: "planner",
          category: "exclusion",
          phrase: "excused from the group discussion",
          reason: "Opts the student out of the learning rather than adjusting how they access it.",
          severity: "medium",
          excerpt: "…Noah could be excused from the group discussion and complete a worksheet instead…",
          detector: "rules",
          created_at: ago(5),
        });
        gov.push({ school_id: school.id, actor_id: tid, actor_name: t.fullName, category: "equity", event_type: "equity_flag_raised", target_type: "student", target_id: second, summary: "1 equity concern(s) flagged on planner output: exclusion.", created_at: ago(5) });
      }
    }

    gov.push({ school_id: school.id, actor_id: adminId, actor_name: "Sandbox Head of School", category: "admin", event_type: "school_created", summary: `Created school ${schoolName}.`, created_at: new Date(Date.now() - 22 * 86_400_000).toISOString() });
    await supabaseAdmin.from("governance_events").insert(gov as never);
    return { ok: true as const, schoolId: school.id };
  });
