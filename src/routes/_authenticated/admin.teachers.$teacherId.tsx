import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Eye } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { createClassForTeacher } from "@/lib/admin.functions";
import { card, inputCls, primaryBtn, useSchool } from "@/lib/use-school";
import { EQUITY_LABELS, type EquityCategory } from "@/lib/equity-types";

export const Route = createFileRoute("/_authenticated/admin/teachers/$teacherId")({
  head: () => ({
    meta: [
      { title: "Teacher Oversight | SameBasis Admin" },
      { name: "description", content: "Read-only oversight of a teacher's classes, adjustments, evidence and AI use." },
      { property: "og:title", content: "Teacher Oversight | SameBasis Admin" },
      { property: "og:description", content: "Read-only oversight of a teacher's classes, adjustments, evidence and AI use." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeacherDetail,
});

function TeacherDetail() {
  const { teacherId } = Route.useParams();
  const { data, reload } = useSchool();
  const createClass = useServerFn(createClassForTeacher);
  const [cls, setCls] = useState({ name: "", yearLevel: 8, subject: "" });
  const t = data?.teachers.find((x) => x.id === teacherId);

  if (!data) return <AppShell title="Teacher oversight" description="Loading…"><div /></AppShell>;
  if (!t) return <AppShell title="Teacher not found" description="This teacher is not part of your school."><Link to="/admin/teachers" className="text-primary underline">Back to teachers</Link></AppShell>;

  const classes = data.classes.filter((c) => c.teacherId === t.id);
  const students = data.students.filter((s) => s.teacherId === t.id);
  const adjustments = data.adjustments.filter((a) => a.teacherId === t.id);
  const evidence = data.evidence.filter((e) => e.teacherId === t.id);
  const activity = data.activity.filter((a) => a.teacherId === t.id);
  const flags = data.flags.filter((f) => f.teacherId === t.id);
  const name = (id: string | null) => data.students.find((s) => s.id === id)?.preferredName ?? "—";

  return (
    <AppShell title={t.fullName} description={`${t.role} · ${t.email} · Year ${t.yearLevel}${t.active ? "" : " · deactivated"}`}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/admin/teachers" className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><ArrowLeft size={16} aria-hidden="true" /> All teachers</Link>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"><Eye size={14} aria-hidden="true" /> Read-only oversight view</span>
        </div>

        <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[["Classes", classes.length], ["Students", students.length], ["Adjustments", adjustments.length], ["Evidence", evidence.length], ["AI events", activity.length], ["Equity flags", flags.length]].map(([l, v]) => (
            <div key={l} className={card}><p className="section-label">{l}</p><p className="mt-2 text-2xl font-bold text-foreground">{v}</p></div>
          ))}
        </section>

        <section className={card}>
          <h2 className="section-label mb-3">Classes and students</h2>
          {classes.map((c) => (
            <div key={c.id} className="mb-3">
              <p className="font-medium text-foreground">{c.name} · Year {c.yearLevel} {c.subject}</p>
              <p className="text-sm text-muted-foreground">{students.filter((s) => s.classId === c.id).map((s) => `${s.preferredName} ${s.lastName} (${s.profile.nccdCategory}, ${s.profile.nccdLevel})`).join(" · ") || "No students yet."}</p>
            </div>
          ))}
          <form
            className="mt-3 grid gap-3 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              void createClass({ data: { teacherId: t.id, ...cls } })
                .then(() => { toast.success("Class created"); setCls({ name: "", yearLevel: 8, subject: "" }); return reload(); })
                .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Couldn't create class"));
            }}
          >
            <input required placeholder="New class name" value={cls.name} onChange={(e) => setCls({ ...cls, name: e.target.value })} className={inputCls} aria-label="Class name" />
            <input required placeholder="Subject" value={cls.subject} onChange={(e) => setCls({ ...cls, subject: e.target.value })} className={inputCls} aria-label="Subject" />
            <select value={cls.yearLevel} onChange={(e) => setCls({ ...cls, yearLevel: Number(e.target.value) })} className={inputCls} aria-label="Year level">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
            <button className={primaryBtn} type="submit">Create class for {t.fullName.split(" ")[0]}</button>
          </form>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={card}>
            <h2 className="section-label mb-3">Recent adjustments</h2>
            <ul className="divide-y divide-border text-sm">
              {adjustments.slice(0, 10).map((a) => (
                <li key={a.id} className="py-2"><span className="font-medium text-foreground">{name(a.studentId)}</span> <span className="text-xs uppercase text-muted-foreground">{a.status}</span><p className="text-muted-foreground">{a.text.slice(0, 180)}{a.text.length > 180 ? "…" : ""}</p></li>
              ))}
              {!adjustments.length && <li className="py-2 text-muted-foreground">None yet.</li>}
            </ul>
          </section>
          <section className={card}>
            <h2 className="section-label mb-3">Recent evidence</h2>
            <ul className="divide-y divide-border text-sm">
              {evidence.slice(0, 10).map((e) => (
                <li key={e.id} className="py-2"><span className="font-medium text-foreground">{name(e.studentId)}</span> · <span className="text-muted-foreground">{e.pillar} · {e.logDate}</span><p className="text-muted-foreground">{e.summary}</p></li>
              ))}
            </ul>
          </section>
        </div>

        <section className={card}>
          <h2 className="section-label mb-3">AI activity and equity flags</h2>
          <ul className="divide-y divide-border text-sm">
            {flags.map((f) => (
              <li key={f.id} className="py-2 text-warning">Equity flag · {EQUITY_LABELS[f.category as EquityCategory] ?? f.category} · {f.status}: “{f.phrase}”</li>
            ))}
            {activity.slice(0, 15).map((a) => (
              <li key={a.id} className="py-2 text-muted-foreground">{new Date(a.createdAt).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} · <span className="font-medium text-foreground">{a.eventType}</span> · {a.surface} · {name(a.studentId)} — {a.summary}</li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
