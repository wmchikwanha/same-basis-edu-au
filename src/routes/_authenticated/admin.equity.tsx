import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Scale } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { resolveEquityFlag } from "@/lib/admin.functions";
import { card, inputCls, primaryBtn, secondaryBtn, useSchool } from "@/lib/use-school";
import { EQUITY_LABELS, type EquityCategory } from "@/lib/equity-types";
import type { SchoolData } from "@/lib/admin-types";

export const Route = createFileRoute("/_authenticated/admin/equity")({
  head: () => ({
    meta: [
      { title: "Ethics & Equity Monitor | SameBasis Admin" },
      { name: "description", content: "Zero-discrimination screening of AI output and equity comparison across student groups." },
      { property: "og:title", content: "Ethics & Equity Monitor | SameBasis Admin" },
      { property: "og:description", content: "Zero-discrimination screening of AI output and equity comparison across student groups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EquityPage,
});

type Student = SchoolData["students"][number];

function groupsFor(students: Student[]) {
  const groups: { label: string; test: (s: Student) => boolean }[] = [
    ...["Cognitive", "Social-Emotional", "Physical", "Sensory"].map((c) => ({ label: `NCCD: ${c}`, test: (s: Student) => s.profile.nccdCategory === c })),
    { label: "CALD / EAL-D", test: (s) => Boolean(s.profile.culturalBackground || s.profile.ealdLevel) },
    { label: "Trauma-informed support", test: (s) => Boolean(s.profile.traumaFlags) },
    { label: "All students", test: () => true },
  ];
  return groups.map((g) => ({ ...g, members: students.filter(g.test) }));
}

function EquityPage() {
  const { data, reload } = useSchool();
  const resolve = useServerFn(resolveEquityFlag);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showResolved, setShowResolved] = useState(false);

  const table = useMemo(() => {
    if (!data) return [];
    return groupsFor(data.students).map((g) => {
      const ids = new Set(g.members.map((s) => s.id));
      const adj = data.adjustments.filter((a) => ids.has(a.studentId));
      const implemented = adj.filter((a) => a.status === "implemented" || a.status === "modified").length;
      const declined = adj.filter((a) => a.status === "declined").length;
      const covered = g.members.filter((s) => data.evidence.some((e) => e.studentId === s.id)).length;
      const flags = data.flags.filter((f) => f.studentId && ids.has(f.studentId)).length;
      return {
        label: g.label,
        n: g.members.length,
        adjPer: g.members.length ? adj.length / g.members.length : 0,
        declineRate: adj.length ? declined / adj.length : 0,
        implemented,
        coverage: g.members.length ? covered / g.members.length : 0,
        flags,
      };
    });
  }, [data]);

  const all = table.find((r) => r.label === "All students");
  const disparity = (r: (typeof table)[number]) =>
    all && r.n > 0 && r.label !== "All students" && (r.coverage < all.coverage * 0.75 || r.declineRate > all.declineRate + 0.25);

  const flags = (data?.flags ?? []).filter((f) => showResolved || f.status === "open");
  const teacherName = (id: string) => data?.teachers.find((t) => t.id === id)?.fullName ?? "—";
  const studentName = (id: string | null) => data?.students.find((s) => s.id === id)?.preferredName ?? "—";

  async function act(id: string, status: "resolved-appropriate" | "resolved-followed-up") {
    const note = (notes[id] ?? "").trim();
    if (note.length < 3) return toast.error("Add a short review note first — it becomes part of the governance record.");
    try {
      await resolve({ data: { flagId: id, status, note } });
      toast.success("Review recorded in the governance log");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't record the review");
    }
  }

  return (
    <AppShell title="Ethics & equity monitor" description="Zero-discrimination screening of every AI output, plus a check that no student group is being under-served.">
      <div className="flex flex-col gap-6">
        <section className={`${card} text-sm text-muted-foreground`}>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Scale size={20} className="text-primary" aria-hidden="true" /> How screening works</h2>
          <p className="mt-2">Every Lesson Planner, Crisis and Family output is checked before the teacher sees it, in two ways. First, fixed rules catch exclusion, lowered expectations, deficit or stigmatising disability language, and cultural stereotyping. Second, an independent AI reviewer applies the Disability Discrimination Act 1992 and the Disability Standards for Education 2005 "same basis" test. The teacher is warned, and each flag is recorded here and in the append-only governance log for your review.</p>
        </section>

        <section className={card}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="section-label">Equity flags ({flags.length})</h2>
            <button type="button" className={secondaryBtn} onClick={() => setShowResolved((v) => !v)}>{showResolved ? "Show open only" : "Include reviewed"}</button>
          </div>
          {!flags.length && <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 size={16} className="text-primary" aria-hidden="true" /> No open flags. All AI output currently meets the zero-discrimination screen.</p>}
          <ul className="flex flex-col gap-4">
            {flags.map((f) => (
              <li key={f.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <AlertTriangle size={16} className={f.severity === "high" ? "text-destructive" : "text-warning"} aria-hidden="true" />
                  <span className="font-semibold text-foreground">{EQUITY_LABELS[f.category as EquityCategory] ?? f.category}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase text-muted-foreground">{f.severity}</span>
                  <span className="text-muted-foreground">· {teacherName(f.teacherId)} · {studentName(f.studentId)} · {f.surface} · {f.detector === "ai-review" ? "AI reviewer" : "rule check"} · {new Date(f.createdAt).toLocaleDateString("en-AU")}</span>
                </div>
                <p className="mt-2 text-sm text-foreground">“{f.excerpt || f.phrase}”</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.reason}</p>
                {f.status === "open" ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input placeholder="Review note (e.g. spoke with teacher; output regenerated)" value={notes[f.id] ?? ""} onChange={(e) => setNotes({ ...notes, [f.id]: e.target.value })} className={inputCls} aria-label="Review note" />
                    <button type="button" className={secondaryBtn} onClick={() => void act(f.id, "resolved-appropriate")}>Reviewed: appropriate</button>
                    <button type="button" className={primaryBtn} onClick={() => void act(f.id, "resolved-followed-up")}>Followed up with teacher</button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-primary">{f.status.replace(/-/g, " ")} · {f.resolutionNote}</p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className={card}>
          <h2 className="section-label mb-1">Equity comparison across student groups</h2>
          <p className="mb-3 text-sm text-muted-foreground">Rows are highlighted when a group's evidence coverage falls below 75% of the school rate, or its decline rate is more than 25 points above the school rate. That pattern can mean a group is being treated differently.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.08em] text-muted-foreground"><tr><th className="py-2">Group</th><th>Students</th><th>Adjustments / student</th><th>Implemented</th><th>Decline rate</th><th>Evidence coverage</th><th>Flags</th></tr></thead>
              <tbody>
                {table.map((r) => (
                  <tr key={r.label} className={`border-t border-border ${disparity(r) ? "bg-warning/10" : ""} ${r.label === "All students" ? "font-semibold" : ""}`}>
                    <td className="py-2 text-foreground">{r.label}{disparity(r) && <span className="ml-2 text-xs text-warning">Review disparity</span>}</td>
                    <td>{r.n}</td><td>{r.adjPer.toFixed(1)}</td><td>{r.implemented}</td>
                    <td>{Math.round(r.declineRate * 100)}%</td><td>{Math.round(r.coverage * 100)}%</td><td>{r.flags}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
