import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Download,
  Sparkles,
  CheckCircle2,
  CircleDashed,
  Printer,
  Filter,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAppState, weekNumberFor, newId } from "@/lib/app-state";
import { StudentAvatar } from "@/components/StudentAvatar";
import { NccdLevelBadge, PillarBadge } from "@/components/Badges";
import type { NccdPillar } from "@/lib/demo-data";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence Log — NCCD Tracking | SameBasis" },
      {
        name: "description",
        content:
          "Track NCCD evidence across the 10-week period by pillar and student, add consultation or review notes, and export an evidence pack for census.",
      },
      { property: "og:title", content: "Evidence Log — NCCD Tracking | SameBasis" },
      {
        property: "og:description",
        content:
          "Track NCCD evidence across the 10-week period by pillar and student, add consultation or review notes, and export an evidence pack for census.",
      },
    ],
  }),
  component: EvidencePage,
});

const WEEKS = Array.from({ length: 10 }, (_, i) => i + 1);
const PILLARS: NccdPillar[] = ["Consultation", "Adjustment", "Monitoring", "Review"];

function EvidencePage() {
  const { students, evidenceLogs, addEvidenceLog } = useAppState();
  const currentWeek = weekNumberFor(new Date());

  const [pillarFilter, setPillarFilter] = useState<NccdPillar | "all">("all");
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newStudentId, setNewStudentId] = useState(students[0]?.id ?? "");
  const [newPillar, setNewPillar] = useState<NccdPillar>("Consultation");
  const [newSummary, setNewSummary] = useState("");

  const filtered = useMemo(
    () =>
      evidenceLogs.filter(
        (l) =>
          (pillarFilter === "all" || l.pillar === pillarFilter) &&
          (studentFilter === "all" || l.studentId === studentFilter),
      ),
    [evidenceLogs, pillarFilter, studentFilter],
  );

  const byStudent = students.map((s) => {
    const logs = evidenceLogs.filter((l) => l.studentId === s.id);
    const weeks = new Set(logs.map((l) => l.weekNumber));
    const pillars = new Set(logs.map((l) => l.pillar));
    return { student: s, logs, weeks, pillars };
  });

  const covered = byStudent.filter((r) => r.logs.length > 0).length;
  const completeness = Math.round((covered / students.length) * 100);
  const allFourPillars = byStudent.filter((r) => r.pillars.size === 4).length;

  const pillarCounts = PILLARS.map((p) => ({
    pillar: p,
    count: evidenceLogs.filter((l) => l.pillar === p).length,
  }));

  function exportCsv() {
    const rows = [
      ["Student", "Date", "Week", "Pillar", "Level of adjustment", "Source", "Evidence summary"],
      ...filtered.map((l) => {
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

  function addManual() {
    if (!newSummary.trim()) {
      toast.error("Add a short description of the evidence first.");
      return;
    }
    const now = new Date();
    addEvidenceLog({
      id: newId("evi"),
      adjustmentId: null,
      studentId: newStudentId,
      logDate: now.toISOString().slice(0, 10),
      weekNumber: weekNumberFor(now),
      pillar: newPillar,
      evidenceSummary: newSummary.trim(),
      source: "teacher-recorded",
      createdAt: now.toISOString(),
    });
    setNewSummary("");
    setShowAdd(false);
    toast.success("Evidence entry added", { description: `Recorded under ${newPillar}.` });
  }

  return (
    <AppShell
      title="Evidence Log"
      description="Every implemented adjustment is auto-tagged by NCCD pillar and tracked against the 10-week evidence period."
      action={
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-warm-sm hover:bg-muted"
          >
            <Plus size={18} aria-hidden="true" />
            Add entry
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-warm-sm hover:bg-muted"
          >
            <Printer size={18} aria-hidden="true" />
            Print / PDF
          </button>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-50"
          >
            <Download size={18} aria-hidden="true" />
            Export CSV
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <div className="rounded-xl bg-card p-5 shadow-warm-sm">
            <p className="section-label">All four pillars</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {allFourPillars} / {students.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Students with full pillar coverage</p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-4">
          {pillarCounts.map(({ pillar, count }) => (
            <button
              key={pillar}
              onClick={() => setPillarFilter((p) => (p === pillar ? "all" : pillar))}
              aria-pressed={pillarFilter === pillar}
              className={`rounded-xl border p-4 text-left transition-colors ${
                pillarFilter === pillar
                  ? "border-primary bg-primary/8"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <p className="text-sm font-semibold text-foreground">{pillar}</p>
              <p className="mt-1 text-2xl font-bold text-primary">{count}</p>
              <p className="text-xs text-muted-foreground">
                {count === 1 ? "entry" : "entries"}
              </p>
            </button>
          ))}
        </section>

        {showAdd && (
          <section className="rounded-xl border border-primary/30 bg-card p-6 shadow-warm-sm print:hidden">
            <h2 className="text-lg font-semibold text-foreground">Add an evidence entry</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              For consultation meetings, observations and reviews that happened away from the
              Lesson Planner.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="section-label">Student</span>
                <select
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.preferredName} {s.lastName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="section-label">Pillar</span>
                <select
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value as NccdPillar)}
                  className="min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {PILLARS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="section-label">What happened</span>
                <textarea
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  rows={3}
                  placeholder="e.g. Phone conversation with mum about seating and noise; agreed to trial the front-left desk for a fortnight."
                  className="rounded-lg border border-input bg-background p-3 text-sm"
                />
              </label>
            </div>
            <button
              onClick={addManual}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-light"
            >
              <Plus size={18} aria-hidden="true" />
              Save entry
            </button>
          </section>
        )}

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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-label">
              Logged evidence
              {filtered.length !== evidenceLogs.length &&
                ` — showing ${filtered.length} of ${evidenceLogs.length}`}
            </h2>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <Filter size={16} className="text-muted-foreground" aria-hidden="true" />
              <label className="sr-only" htmlFor="pillar-filter">
                Filter by pillar
              </label>
              <select
                id="pillar-filter"
                value={pillarFilter}
                onChange={(e) => setPillarFilter(e.target.value as NccdPillar | "all")}
                className="min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="all">All pillars</option>
                {PILLARS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="student-filter">
                Filter by student
              </label>
              <select
                id="student-filter"
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                className="min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="all">All students</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.preferredName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
          ) : filtered.length === 0 ? (
            <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-warm-sm">
              No entries match this filter.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {filtered.map((log) => {
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
