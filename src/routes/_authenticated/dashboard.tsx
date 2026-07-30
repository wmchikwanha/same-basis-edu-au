import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Users,
  ClipboardCheck,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAppState, weekNumberFor } from "@/lib/app-state";
import { demoUser } from "@/lib/brand";
import { NccdLevelBadge } from "@/components/Badges";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "SameBasis Dashboard — Inclusive Teaching Decision Support" },
      {
        name: "description",
        content:
          "See today's classes, NCCD evidence completeness and recent reasonable adjustments for your students at a glance.",
      },
      { property: "og:title", content: "SameBasis Dashboard — Inclusive Teaching Decision Support" },
      {
        property: "og:description",
        content:
          "See today's classes, NCCD evidence completeness and recent reasonable adjustments for your students at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-xl bg-card p-5 shadow-warm-sm">
      <div className="flex items-center justify-between">
        <p className="section-label">{label}</p>
        <Icon size={20} className="text-primary" aria-hidden="true" />
      </div>
      <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Dashboard() {
  const { students, classes, adjustments, evidenceLogs, hydrated } = useAppState();
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);

  const implemented = adjustments.filter((a) => a.status === "implemented");
  const currentWeek = weekNumberFor(new Date());
  const studentsWithEvidence = new Set(evidenceLogs.map((l) => l.studentId));
  const completeness = Math.round((studentsWithEvidence.size / students.length) * 100);
  const awaitingEvidence = students.filter((s) => !studentsWithEvidence.has(s.id));

  return (
    <AppShell
      title={`${greeting}, ${demoUser.firstName}.`}
      description={
        hydrated
          ? `You have ${students.length} students with active adjustment profiles today.`
          : "Loading your classroom…"
      }
      action={
        <Link
          to="/planner"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-warm-sm transition-colors hover:bg-primary-light"
        >
          <Sparkles size={18} aria-hidden="true" />
          Plan a lesson
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-xl bg-primary p-6 text-primary-foreground shadow-warm-md">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-primary-foreground/75">
            Term 3 · Week {currentWeek} of 10
          </p>
          <h2 className="mt-2 max-w-2xl text-xl font-semibold sm:text-2xl">
            Six students, six different entry points into Chemical Reactions.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85">
            SameBasis connects disability, culture and curriculum so the adjustment you make in
            the next five minutes is specific, defensible and already logged for NCCD.
          </p>
        </section>

        <section aria-label="Quick statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Students"
            value={String(students.length)}
            hint="Across 1 class"
            icon={Users}
          />
          <StatCard
            label="NCCD profiles"
            value={String(students.length)}
            hint="All profiles complete"
            icon={ClipboardCheck}
          />
          <StatCard
            label="Implemented this week"
            value={String(implemented.length)}
            hint="Adjustments put into practice"
            icon={TrendingUp}
          />
          <StatCard
            label="Evidence completeness"
            value={`${completeness}%`}
            hint={`${studentsWithEvidence.size} of ${students.length} students have logged evidence`}
            icon={Clock}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <h2 className="section-label mb-3">Today's classes</h2>
            <div className="flex flex-col gap-4">
              {classes.map((c) => (
                <Link
                  key={c.id}
                  to="/classes/$classId"
                  params={{ classId: c.id }}
                  className="group flex items-center justify-between gap-4 rounded-xl bg-card p-5 shadow-warm-sm transition-shadow hover:shadow-warm-md"
                >
                  <div>
                    <p className="font-semibold text-foreground group-hover:text-primary">
                      {c.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Year {c.yearLevel} {c.subject} ·{" "}
                      {students.filter((s) => s.classId === c.id).length} students with active
                      profiles
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {students
                        .filter((s) => s.classId === c.id)
                        .map((s) => (
                          <NccdLevelBadge key={s.id} level={s.profile.nccdLevel} />
                        ))}
                    </div>
                  </div>
                  <ArrowRight
                    size={20}
                    className="shrink-0 text-muted-foreground group-hover:text-primary"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="section-label mb-3">Gentle reminders</h2>
            <div className="rounded-xl bg-accent/20 p-5">
              <p className="text-sm text-foreground">
                {awaitingEvidence.length === 0
                  ? "Every student has evidence logged this cycle. Nothing needs your attention."
                  : `${awaitingEvidence.length} ${awaitingEvidence.length === 1 ? "student has" : "students have"} no evidence logged yet in this 10-week cycle. There is still time.`}
              </p>
              {awaitingEvidence.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5 text-sm text-foreground">
                  {awaitingEvidence.slice(0, 4).map((s) => (
                    <li key={s.id}>· {s.preferredName} {s.lastName}</li>
                  ))}
                </ul>
              )}
              <Link
                to="/evidence"
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Open the Evidence Log
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <h2 className="section-label mb-3 mt-6">Recent activity</h2>
            <div className="rounded-xl bg-card p-5 shadow-warm-sm">
              {adjustments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing yet. Generate your first set of adjustments from the Lesson Planner.
                </p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {adjustments.slice(0, 5).map((a) => {
                    const s = students.find((st) => st.id === a.studentId);
                    return (
                      <li key={a.id} className="text-sm">
                        <p className="font-medium text-foreground">
                          {s?.preferredName ?? "Student"} · {a.status}
                        </p>
                        <p className="line-clamp-2 text-muted-foreground">
                          {a.generatedAdjustment}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
