import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ClipboardCheck, GraduationCap, Scale, School, ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { card, useSchool } from "@/lib/use-school";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "School Overview | SameBasis Admin" },
      { name: "description", content: "Whole-school NCCD evidence, teacher oversight, AI governance and equity monitoring." },
      { property: "og:title", content: "School Overview | SameBasis Admin" },
      { property: "og:description", content: "Whole-school NCCD evidence, teacher oversight, AI governance and equity monitoring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Overview,
});

const PILLARS = ["Consultation", "Adjustment", "Monitoring", "Review"];

function Overview() {
  const { data, isLoading, error } = useSchool();
  if (isLoading || !data)
    return (
      <AppShell title="School overview" description={error ? "We couldn't load the school. Refresh to try again." : "Loading school…"}>
        <div />
      </AppShell>
    );

  const teachers = data.teachers.filter((t) => !t.isAdmin);
  const withEvidence = new Set(data.evidence.map((e) => e.studentId));
  const completeness = data.students.length ? Math.round((withEvidence.size / data.students.length) * 100) : 0;
  const gens = data.activity.filter((a) => a.eventType === "generated" || a.eventType === "regenerated").length;
  const accepted = data.activity.filter((a) => a.eventType === "accepted").length;
  const openFlags = data.flags.filter((f) => f.status === "open");
  const noConsent = teachers.filter((t) => !t.aiConsent);

  const stats = [
    { label: "Teachers", value: teachers.length, icon: GraduationCap },
    { label: "Students (whole school)", value: data.students.length, icon: School },
    { label: "Evidence completeness", value: `${completeness}%`, icon: ClipboardCheck },
    { label: "AI generations", value: gens, icon: Sparkles },
    { label: "AI acceptance rate", value: gens ? `${Math.round((accepted / gens) * 100)}%` : "—", icon: ShieldCheck },
    { label: "Open equity flags", value: openFlags.length, icon: Scale },
  ];

  return (
    <AppShell title={data.school.name} description="Head-of-school console: teacher oversight, whole-school NCCD evidence, AI governance and equity.">
      <div className="flex flex-col gap-6">
        {(openFlags.length > 0 || noConsent.length > 0) && (
          <section className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground">
            <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} aria-hidden="true" /> Needs your attention</p>
            <ul className="mt-2 list-disc pl-5 text-muted-foreground">
              {openFlags.length > 0 && <li>{openFlags.length} AI output equity flag(s) awaiting review. <Link to="/admin/equity" className="font-medium text-primary underline">Review now</Link></li>}
              {noConsent.map((t) => <li key={t.id}>{t.fullName} has not given AI processing consent.</li>)}
            </ul>
          </section>
        )}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className={card}>
              <div className="flex items-center justify-between"><p className="section-label">{label}</p><Icon size={20} className="text-primary" aria-hidden="true" /></div>
              <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={card}>
            <h2 className="section-label mb-3">Evidence completeness by teacher</h2>
            <ul className="flex flex-col gap-3">
              {teachers.map((t) => {
                const mine = data.students.filter((s) => s.teacherId === t.id);
                const covered = mine.filter((s) => withEvidence.has(s.id)).length;
                const pct = mine.length ? Math.round((covered / mine.length) * 100) : 0;
                return (
                  <li key={t.id}>
                    <div className="flex justify-between text-sm">
                      <Link to="/admin/teachers/$teacherId" params={{ teacherId: t.id }} className="font-medium text-foreground hover:underline">{t.fullName}{!t.active && " (deactivated)"}</Link>
                      <span className="text-muted-foreground">{covered}/{mine.length} · {pct}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className={card}>
            <h2 className="section-label mb-3">Evidence by NCCD pillar</h2>
            <ul className="flex flex-col gap-3">
              {PILLARS.map((p) => {
                const n = data.evidence.filter((e) => e.pillar === p).length;
                return (
                  <li key={p}>
                    <div className="flex justify-between text-sm"><span className="font-medium text-foreground">{p}</span><span className="text-muted-foreground">{n}</span></div>
                    <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-secondary" style={{ width: `${data.evidence.length ? (n / data.evidence.length) * 100 : 0}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <section className={card}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-label">Latest governance events</h2>
            <Link to="/admin/governance" className="text-sm font-medium text-primary hover:underline">Full log</Link>
          </div>
          <ul className="divide-y divide-border text-sm">
            {data.governance.slice(0, 8).map((g) => (
              <li key={g.id} className="flex flex-wrap gap-x-3 py-2">
                <span className="text-muted-foreground">{new Date(g.createdAt).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <span className="font-medium text-foreground">{g.actorName || "—"}</span>
                <span className="text-muted-foreground">{g.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
