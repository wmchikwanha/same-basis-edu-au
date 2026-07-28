import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Sparkles, CheckCircle2, CircleDashed } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAppState, weekNumberFor } from "@/lib/app-state";
import { StudentAvatar } from "@/components/StudentAvatar";
import { NccdLevelBadge, PillarBadge } from "@/components/Badges";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence Log — NCCD Tracking | SameBasis" },
      {
        name: "description",
        content:
          "Track NCCD evidence across the 10-week period, see completeness per student and export an evidence pack for census submission.",
      },
      { property: "og:title", content: "Evidence Log — NCCD Tracking | SameBasis" },
      {
        property: "og:description",
        content:
          "Track NCCD evidence across the 10-week period, see completeness per student and export an evidence pack for census submission.",
      },
    ],
  }),
  component: EvidencePage,
});

const WEEKS = Array.from({ length: 10 }, (_, i) => i + 1);

function EvidencePage() {
  const { students, evidenceLogs } = useAppState();
  const currentWeek = weekNumberFor(new Date());

  const byStudent = students.map((s) => {
    const logs = evidenceLogs.filter((l) => l.studentId === s.id);
    const weeks = new Set(logs.map((l) => l.weekNumber));
    return { student: s, logs, weeks };
  });

  const covered = byStudent.filter((r) => r.logs.length > 0).length;
  const completeness = Math.round((covered / students.length) * 100);

  function exportCsv() {
    const rows = [
      ["Student", "Date", "Week", "Pillar", "Evidence type", "Source", "Evidence summary"],
      ...evidenceLogs.map((l) => {
        const s = students.find((st) => st.id === l.studentId);
        return [
          s ? `${s.firstName} ${s.lastName}` : l.studentId,
          l.logDate,
          String(l.weekNumber),
          l.pillar,
          s?.profile.nccdLevel ?? "",
          l.source,
          l.evidenceSummary,
        ];
      }),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `samebasis-nccd-evidence-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell
      title="Evidence Log"
      description="Every implemented adjustment is auto-tagged by NCCD pillar and tracked against the 10-week evidence period."
      action={
        <button
          onClick={exportCsv}
          disabled={evidenceLogs.length === 0}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-warm-sm hover:bg-muted disabled:opacity-50"
        >
          <Download size={18} aria-hidden="true" />
          Export evidence pack (CSV)
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-card p-5 shadow-warm-sm">
            <p className="section-label">Current week</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{currentWeek} / 10</p>
            <p className="mt-1 text-xs text-muted-foreground">NCCD evidence period</p>
          </div>
          <div className="rounded-xl bg-card p-5 shadow-warm-sm">
            <p className="section-label">Evidence completeness</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{completeness}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {covered} of {students.length} students
            </p>
          </div>
          <div className="rounded-xl bg-card p-5 shadow-warm-sm">
            <p className="section-label">Entries logged</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{evidenceLogs.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Across all pillars</p>
          </div>
        </section>

        <section className="overflow-x-auto rounded-xl bg-card p-5 shadow-warm-sm">
          <h2 className="section-label mb-4">10-week coverage</h2>
          <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-sm">
            <caption className="sr-only">
              Weekly NCCD evidence coverage for each student across the ten week period
            </caption>
            <thead>
              <tr>
                <th scope="col" className="pb-2 text-left font-medium text-muted-foreground">
                  Student
                </th>
                {WEEKS.map((w) => (
                  <th
                    key={w}
                    scope="col"
                    className="pb-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    W{w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byStudent.map(({ student, weeks }) => (
                <tr key={student.id}>
                  <th scope="row" className="py-1 pr-4 text-left font-normal">
                    <span className="flex items-center gap-2">
                      <StudentAvatar student={student} size="sm" />
                      <span className="whitespace-nowrap">
                        <span className="block font-medium text-foreground">
                          {student.preferredName} {student.lastName}
                        </span>
                        <NccdLevelBadge level={student.profile.nccdLevel} />
                      </span>
                    </span>
                  </th>
                  {WEEKS.map((w) => {
                    const has = weeks.has(w);
                    const past = w <= currentWeek;
                    return (
                      <td key={w} className="px-0.5 text-center">
                        <span
                          title={
                            has
                              ? `Week ${w}: evidence logged`
                              : past
                                ? `Week ${w}: no evidence`
                                : `Week ${w}: not yet`
                          }
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs ${
                            has
                              ? "bg-success-soft text-primary"
                              : past
                                ? "bg-warning-soft text-warning"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {has ? (
                            <CheckCircle2 size={14} aria-hidden="true" />
                          ) : (
                            <CircleDashed size={14} aria-hidden="true" />
                          )}
                          <span className="sr-only">
                            {has ? "Evidence logged" : past ? "Missing evidence" : "Upcoming"}
                          </span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="section-label mb-3">Logged evidence</h2>
          {evidenceLogs.length === 0 ? (
            <div className="rounded-xl bg-card p-8 text-center shadow-warm-sm">
              <p className="text-sm text-muted-foreground">
                No evidence logged yet. Implement an adjustment in the Lesson Planner and it will
                appear here automatically.
              </p>
              <Link
                to="/planner"
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-light"
              >
                <Sparkles size={18} aria-hidden="true" />
                Open the Lesson Planner
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {evidenceLogs.map((log) => {
                const s = students.find((st) => st.id === log.studentId);
                return (
                  <li key={log.id} className="rounded-xl bg-card p-5 shadow-warm-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">
                        {s ? `${s.preferredName} ${s.lastName}` : "Student"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <PillarBadge pillar={log.pillar} />
                        <span className="text-xs text-muted-foreground">
                          Week {log.weekNumber} ·{" "}
                          {new Date(log.logDate).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          · {log.source}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{log.evidenceSummary}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
