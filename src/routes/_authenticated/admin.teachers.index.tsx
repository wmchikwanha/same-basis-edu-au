import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { createTeacher, setTeacherActive } from "@/lib/admin.functions";
import { card, inputCls, primaryBtn, secondaryBtn, useSchool } from "@/lib/use-school";

export const Route = createFileRoute("/_authenticated/admin/teachers/")({
  head: () => ({
    meta: [
      { title: "Teachers | SameBasis Admin" },
      { name: "description", content: "Create teacher accounts, oversee classes and manage access across the school." },
      { property: "og:title", content: "Teachers | SameBasis Admin" },
      { property: "og:description", content: "Create teacher accounts, oversee classes and manage access across the school." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeacherList,
});


function TeacherList() {
  const { data, reload } = useSchool();
  const create = useServerFn(createTeacher);
  const toggle = useServerFn(setTeacherActive);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", yearLevel: 8, role: "Classroom Teacher" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ data: form });
      toast.success(`Account created for ${form.fullName}. They can sign in now with that email and password.`);
      setForm({ fullName: "", email: "", password: "", yearLevel: 8, role: "Classroom Teacher" });
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Teachers" description="Oversee every teacher, create accounts and manage access. All changes are recorded in the governance log.">
      <div className="flex flex-col gap-6">
        <section className={card}>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><UserPlus size={20} className="text-primary" aria-hidden="true" /> Create a teacher account</h2>
          <p className="mt-1 text-sm text-muted-foreground">No email verification needed. Share the temporary password with the teacher directly.</p>
          <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} aria-label="Full name" />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} aria-label="Email" />
            <input required minLength={8} placeholder="Temporary password (8+)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} aria-label="Temporary password" />
            <select value={form.yearLevel} onChange={(e) => setForm({ ...form, yearLevel: Number(e.target.value) })} className={inputCls} aria-label="Year level">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
            <button type="submit" disabled={busy} className={primaryBtn}>{busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}Create account</button>
          </form>
        </section>

        <section className={card}>
          <h2 className="section-label mb-3">All staff</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                <tr><th className="py-2">Name</th><th>Email</th><th>Classes</th><th>Students</th><th>Evidence</th><th>AI consent</th><th>Last AI activity</th><th /></tr>
              </thead>
              <tbody>
                {(data?.teachers ?? []).map((t) => {
                  const classes = data!.classes.filter((c) => c.teacherId === t.id).length;
                  const students = data!.students.filter((s) => s.teacherId === t.id).length;
                  const evidence = data!.evidence.filter((e) => e.teacherId === t.id).length;
                  const last = data!.activity.find((a) => a.teacherId === t.id);
                  return (
                    <tr key={t.id} className="border-t border-border">
                      <td className="py-2 font-medium text-foreground">
                        {t.isAdmin ? t.fullName : <Link to="/admin/teachers/$teacherId" params={{ teacherId: t.id }} className="hover:underline">{t.fullName}</Link>}
                        <span className="block text-xs text-muted-foreground">{t.isAdmin ? "School admin" : t.role}{!t.active && " · deactivated"}</span>
                      </td>
                      <td className="text-muted-foreground">{t.email}</td>
                      <td>{classes}</td><td>{students}</td><td>{evidence}</td>
                      <td className={t.aiConsent ? "text-foreground" : "text-warning"}>{t.aiConsent ? `Yes · ${t.aiConsentAt ? new Date(t.aiConsentAt).toLocaleDateString("en-AU") : ""}` : "Not given"}</td>
                      <td className="text-muted-foreground">{last ? new Date(last.createdAt).toLocaleDateString("en-AU") : "—"}</td>
                      <td className="py-2 text-right">
                        {!t.isAdmin && (
                          <button
                            type="button"
                            className={secondaryBtn}
                            onClick={() =>
                              void toggle({ data: { teacherId: t.id, active: !t.active } })
                                .then(() => { toast.success(t.active ? "Teacher deactivated — records kept" : "Teacher reactivated"); return reload(); })
                                .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't update access"))
                            }
                          >
                            {t.active ? "Deactivate" : "Reactivate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
