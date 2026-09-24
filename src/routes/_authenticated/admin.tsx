import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCheck, ShieldCheck, TrendingUp, Users, Upload, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAppState } from "@/lib/app-state";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "School Admin Overview | SameBasis" },
      {
        name: "description",
        content: "School-wide view of NCCD evidence coverage, adjustments and AI oversight.",
      },
      { property: "og:title", content: "School Admin Overview | SameBasis" },
      {
        property: "og:description",
        content: "School-wide view of NCCD evidence coverage, adjustments and AI oversight.",
      },
    ],
  }),
  component: AdminDashboard,
});

const PILLARS = ["Consultation", "Adjustment", "Monitoring", "Review"] as const;

function AdminDashboard() {
  const { students, classes, adjustments, evidenceLogs, hydrated } = useAppState();
  const withEvidence = new Set(evidenceLogs.map((l) => l.studentId));
  const completeness = students.length
    ? Math.round((withEvidence.size / students.length) * 100)
    : 0;
  const implemented = adjustments.filter((a) => a.status === "implemented").length;
  const pillarCounts = PILLARS.map((p) => ({
    p,
    n: evidenceLogs.filter((l) => l.pillar === p).length,
  }));

  const stats = [
    { label: "Classes", value: classes.length, icon: Users },
    { label: "Students on NCCD profiles", value: students.length, icon: ClipboardCheck },
    { label: "Adjustments implemented", value: implemented, icon: TrendingUp },
    { label: "Evidence completeness", value: `${completeness}%`, icon: ShieldCheck },
  ];

  return (
    <AppShell
      title="School admin overview"
      description={
        hydrated
          ? "Whole-school view of NCCD evidence, adjustments and AI oversight across classes."
          : "Loading school overview…"
      }
    >
      <div className="flex flex-col gap-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl bg-card p-5 shadow-warm-sm">
              <div className="flex items-center justify-between">
                <p className="section-label">{label}</p>
                <Icon size={20} className="text-primary" aria-hidden="true" />
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl bg-card p-5 shadow-warm-sm">
            <h2 className="section-label mb-3">Evidence by NCCD pillar</h2>
            <ul className="flex flex-col gap-3">
              {pillarCounts.map(({ p, n }) => (
                <li key={p}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{p}</span>
                    <span className="text-muted-foreground">{n}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${evidenceLogs.length ? (n / evidenceLogs.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl bg-card p-5 shadow-warm-sm">
            <h2 className="section-label mb-3">Classes</h2>
            <ul className="divide-y divide-border">
              {classes.map((c) => {
                const cs = students.filter((s) => s.classId === c.id);
                const covered = cs.filter((s) => withEvidence.has(s.id)).length;
                return (
                  <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                    <span className="font-medium text-foreground">
                      {c.name} · Year {c.yearLevel}
                    </span>
                    <span className="text-muted-foreground">
                      {covered}/{cs.length} with evidence
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <section className="flex flex-wrap gap-3">
          <Link to="/evidence" className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-light">
            <FileText size={18} aria-hidden="true" /> Review evidence log
          </Link>
          <Link to="/import" className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted">
            <Upload size={18} aria-hidden="true" /> Import school data
          </Link>
          <Link to="/settings" className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted">
            <ShieldCheck size={18} aria-hidden="true" /> AI audit trail
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
