import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Sparkles,
  Check,
  Pencil,
  X,
  Bookmark,
  Loader2,
  AlertTriangle,
  Info,
  Globe2,
  ShieldAlert,
  Users2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StudentAvatar } from "@/components/StudentAvatar";
import { AiBadge, CaldBadge, NccdLevelBadge, PillarBadge } from "@/components/Badges";
import { useAppState, newId, weekNumberFor } from "@/lib/app-state";
import { generateAdjustment } from "@/lib/adjustments.functions";
import { isCald, type AdjustmentRecord, type Student } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Lesson Planner — Generate Reasonable Adjustments | SameBasis" },
      {
        name: "description",
        content:
          "Choose a class and curriculum topic and get specific, evidence-based reasonable adjustments for each student, auto-tagged for NCCD.",
      },
      {
        property: "og:title",
        content: "Lesson Planner — Generate Reasonable Adjustments | SameBasis",
      },
      {
        property: "og:description",
        content:
          "Choose a class and curriculum topic and get specific, evidence-based reasonable adjustments for each student, auto-tagged for NCCD.",
      },
    ],
  }),
  component: Planner,
});

type Draft = {
  studentId: string;
  adjustment: string;
  udlBenefit: string;
  culturalNote: string;
  traumaNote: string;
  rationale: string;
};

function StepHeading({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {step}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function Planner() {
  const {
    profile,
    classes,
    students,
    topics,
    addAdjustment,
    addEvidenceLog,
    updateAdjustment,
    adjustments,
  } = useAppState();
  const assessmentContext = profile?.assessmentContext?.trim() ?? "";
  const runGenerate = useServerFn(generateAdjustment);

  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [activity, setActivity] = useState("");
  const roster = students.filter((s) => s.classId === classId);
  const [selectedIds, setSelectedIds] = useState<string[]>(roster.map((s) => s.id));

  const [doneCount, setDoneCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [handled, setHandled] = useState<Record<string, "implemented" | "declined" | "saved">>({});
  const [error, setError] = useState<string | null>(null);

  const klass = classes.find((c) => c.id === classId);
  const topic = topics.find((t) => t.id === topicId);

  function toggleStudent(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleGenerate() {
    if (!klass || !topic || selectedIds.length === 0) return;
    setGenerating(true);
    setError(null);
    setDrafts([]);
    setHandled({});
    setDoneCount(0);

    const queue = selectedIds
      .map((id) => students.find((s) => s.id === id))
      .filter((s): s is Student => Boolean(s));

    const collected: Draft[] = [];
    let failure: string | null = null;
    let cursor = 0;

    const worker = async () => {
      while (cursor < queue.length && !failure) {
        const student = queue[cursor++];
        const p = student.profile;
        const res = await runGenerate({
          data: {
            studentName: student.preferredName,
            yearLevel: profile?.yearLevel ?? klass.yearLevel,
            nccdCategory: p.nccdCategory,
            nccdLevel: p.nccdLevel,
            functionalDescription: p.primaryDiagnosis
              ? `${p.primaryDiagnosis}. ${p.functionalDescription}`
              : p.functionalDescription,
            culturalBackground: p.culturalBackground,
            languagesSpoken: p.languagesSpoken,
            ealdLevel: p.ealdLevel,
            traumaFlags: p.traumaFlags,
            knownTriggers: p.knownTriggers,
            calmingStrategies: p.calmingStrategies,
            strengths: p.strengths,
            iepGoals: p.iepGoals,
            subject: klass.subject,
            topic: topic.topic,
            topicDescription: topic.description,
            activityDescription: assessmentContext
              ? `${activity}${activity ? ". " : ""}Assessment context: ${assessmentContext}`
              : activity,
          },
        }).catch((err: unknown) => ({
          ok: false as const,
          error: err instanceof Error ? err.message : "Generation failed.",
        }));

        if (!res.ok) {
          failure = res.error;
          return;
        }

        collected.push({
          studentId: student.id,
          adjustment: res.result.adjustment,
          udlBenefit: res.result.udl_benefit,
          culturalNote: res.result.cultural_note,
          traumaNote: res.result.trauma_note,
          rationale: res.result.rationale,
        });
        const order = new Map(selectedIds.map((id, i) => [id, i]));
        setDrafts(
          [...collected].sort(
            (a, b) => (order.get(a.studentId) ?? 0) - (order.get(b.studentId) ?? 0),
          ),
        );
        setDoneCount(collected.length);
      }
    };

    const lanes = Math.min(3, queue.length);
    await Promise.all(Array.from({ length: lanes }, worker));

    if (failure) setError(failure);
    setGenerating(false);
  }

  function commit(draft: Draft, status: "implemented" | "declined" | "saved") {
    const student = students.find((s) => s.id === draft.studentId);
    if (!student || !klass || !topic) return;
    const now = new Date();
    const wasEdited = editingId === draft.studentId;

    const record: AdjustmentRecord = {
      id: newId("adj"),
      studentId: draft.studentId,
      classId: klass.id,
      curriculumTopicId: topic.id,
      activityDescription: activity,
      generatedAdjustment: draft.adjustment,
      udlBenefit: draft.udlBenefit,
      culturalNote: isNoteMeaningful(draft.culturalNote) ? draft.culturalNote : null,
      traumaNote: isNoteMeaningful(draft.traumaNote) ? draft.traumaNote : null,
      rationale: draft.rationale,
      nccdPillar: "Adjustment",
      evidenceType: student.profile.nccdLevel,
      teacherAction: null,
      status: status === "implemented" && wasEdited ? "modified" : status,
      createdAt: now.toISOString(),
      implementedAt: status === "implemented" ? now.toISOString() : null,
    };
    addAdjustment(record);

    if (status === "implemented") {
      addEvidenceLog({
        id: newId("evi"),
        adjustmentId: record.id,
        studentId: student.id,
        logDate: now.toISOString().slice(0, 10),
        weekNumber: weekNumberFor(now),
        pillar: "Adjustment",
        evidenceSummary: `${topic.topic}: ${draft.adjustment}`,
        source: wasEdited ? "teacher-edited" : "AI-generated",
        createdAt: now.toISOString(),
      });
      toast.success(`Logged for ${student.preferredName}`, {
        description: "Evidence recorded against the NCCD Adjustment pillar.",
      });
    } else if (status === "saved") {
      toast.success(`Saved for later — ${student.preferredName}`);
    } else {
      toast(`Declined for ${student.preferredName}`, {
        description: "Nothing was logged as evidence.",
      });
    }

    setHandled((prev) => ({ ...prev, [draft.studentId]: status }));
    setEditingId(null);
    void updateAdjustment;
    void adjustments;
  }

  return (
    <AppShell
      title="Lesson Planner"
      description="You are the expert. SameBasis suggests; nothing is implemented until you say so."
    >
      <div className="flex flex-col gap-8">
        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <StepHeading
            step={1}
            title="Select context"
            hint="What are you about to teach, and to whom?"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="section-label">Class</span>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSelectedIds(
                    students.filter((s) => s.classId === e.target.value).map((s) => s.id),
                  );
                }}
                className="min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="section-label">Curriculum topic</span>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.topic}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="section-label">Specific activity (optional)</span>
              <input
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="e.g. Group experiment with Bunsen burners"
                className="min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>
          </div>
          {topic && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-muted/70 p-3 text-sm text-muted-foreground">
              <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <strong className="text-foreground">{topic.strand}:</strong> {topic.description}
              </span>
            </p>
          )}
        </section>

        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <StepHeading
            step={2}
            title="Review students"
            hint="Everyone with an active NCCD profile is selected by default."
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {roster.map((s) => {
              const checked = selectedIds.includes(s.id);
              return (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    checked ? "border-primary bg-primary/5" : "border-border bg-background"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStudent(s.id)}
                    className="mt-1 h-5 w-5 accent-[var(--color-primary)]"
                  />
                  <StudentAvatar student={s} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {s.preferredName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {s.profile.nccdCategory} · {s.profile.nccdLevel}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl bg-card p-6 shadow-warm-sm" data-tour="planner-generate">
          <StepHeading
            step={3}
            title="Generate"
            hint="Each adjustment is written for this student, in this lesson, on this topic. All selected students are generated at once."
          />
          <button
            onClick={handleGenerate}
            disabled={generating || selectedIds.length === 0}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light disabled:opacity-60"
          >
            {generating ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles size={18} aria-hidden="true" />
            )}
            {generating
              ? "Consulting the evidence base…"
              : `Generate adjustments for ${selectedIds.length} ${selectedIds.length === 1 ? "student" : "students"}`}
          </button>

          {generating && (
            <div className="mt-4">
              <p aria-live="polite" className="text-sm text-muted-foreground">
                Working through {selectedIds.length} students in parallel — {doneCount} of{" "}
                {selectedIds.length} ready.
              </p>
              <div className="mt-2 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.round((doneCount / Math.max(selectedIds.length, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}


          {error && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-sm text-warning"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </section>

        {drafts.length > 0 && (
          <section>
            <StepHeading
              step={4}
              title="Review and decide"
              hint="Every suggestion is editable. Nothing is logged until you implement it."
            />
            <div className="flex flex-col gap-5">
              {drafts.map((draft) => {
                const student = students.find((s) => s.id === draft.studentId)!;
                return (
                  <AdjustmentCard
                    key={draft.studentId}
                    student={student}
                    draft={draft}
                    editing={editingId === draft.studentId}
                    outcome={handled[draft.studentId]}
                    onEdit={() => setEditingId(draft.studentId)}
                    onChange={(patch) =>
                      setDrafts((prev) =>
                        prev.map((d) =>
                          d.studentId === draft.studentId ? { ...d, ...patch } : d,
                        ),
                      )
                    }
                    onCommit={(status) => commit(draft, status)}
                  />
                );
              })}
            </div>
            <div className="mt-6 rounded-xl bg-accent/20 p-5">
              <p className="text-sm text-foreground">
                Implemented adjustments are timestamped and written to the Evidence Log against
                the NCCD Adjustment pillar.
              </p>
              <Link
                to="/evidence"
                className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Open the Evidence Log
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function isNoteMeaningful(note: string): boolean {
  return !!note && !/^no specific (cultural|trauma) note/i.test(note.trim());
}

function AdjustmentCard({
  student,
  draft,
  editing,
  outcome,
  onEdit,
  onChange,
  onCommit,
}: {
  student: Student;
  draft: Draft;
  editing: boolean;
  outcome?: "implemented" | "declined" | "saved";
  onEdit: () => void;
  onChange: (patch: Partial<Draft>) => void;
  onCommit: (status: "implemented" | "declined" | "saved") => void;
}) {
  const showCultural = isNoteMeaningful(draft.culturalNote);
  const showTrauma = isNoteMeaningful(draft.traumaNote);

  return (
    <article className="rounded-xl bg-card p-6 shadow-warm-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <StudentAvatar student={student} />
          <div>
            <h3 className="font-semibold text-foreground">
              {student.preferredName} {student.lastName}
            </h3>
            <p className="text-xs text-muted-foreground">
              {student.profile.nccdCategory} · {student.profile.functionalDescription.slice(0, 60)}…
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AiBadge />
          <NccdLevelBadge level={student.profile.nccdLevel} />
          {isCald(student) && <CaldBadge label={student.profile.culturalBackground ?? undefined} />}
        </div>
      </header>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <p className="section-label">The adjustment</p>
          {editing ? (
            <textarea
              value={draft.adjustment}
              onChange={(e) => onChange({ adjustment: e.target.value })}
              rows={5}
              aria-label={`Edit adjustment for ${student.preferredName}`}
              className="mt-1 w-full rounded-lg border border-input bg-background p-3 text-sm"
            />
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-foreground">{draft.adjustment}</p>
          )}
        </div>

        <div className="rounded-lg bg-success-soft p-4">
          <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-primary">
            <Users2 size={14} aria-hidden="true" />
            This also supports
          </p>
          <p className="text-sm text-foreground">{draft.udlBenefit}</p>
        </div>

        {showCultural && (
          <div className="rounded-lg bg-accent/20 p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-foreground">
              <Globe2 size={14} aria-hidden="true" />
              Cultural consideration
            </p>
            <p className="text-sm text-foreground">{draft.culturalNote}</p>
          </div>
        )}

        {showTrauma && (
          <div className="rounded-lg bg-warning-soft p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-warning">
              <ShieldAlert size={14} aria-hidden="true" />
              Trauma-informed note
            </p>
            <p className="text-sm text-foreground">{draft.traumaNote}</p>
          </div>
        )}

        <p className="text-sm italic text-muted-foreground">Why: {draft.rationale}</p>

        <div className="flex flex-wrap items-center gap-2">
          <PillarBadge pillar="Adjustment" />
          <span className="text-xs text-muted-foreground">
            Evidence type: {student.profile.nccdLevel}
          </span>
        </div>
      </div>

      <footer className="mt-5 border-t border-border pt-4">
        {outcome ? (
          <p className="text-sm font-medium text-primary">
            {outcome === "implemented"
              ? "Implemented and logged as NCCD evidence."
              : outcome === "saved"
                ? "Saved for later. No evidence logged."
                : "Declined. No evidence logged."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onCommit("implemented")}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-light"
            >
              <Check size={16} aria-hidden="true" />
              {editing ? "Save and implement" : "Implement as is"}
            </button>
            {!editing && (
              <button
                onClick={onEdit}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Pencil size={16} aria-hidden="true" />
                Modify
              </button>
            )}
            <button
              onClick={() => onCommit("saved")}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Bookmark size={16} aria-hidden="true" />
              Save for later
            </button>
            <button
              onClick={() => onCommit("declined")}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <X size={16} aria-hidden="true" />
              Decline
            </button>
          </div>
        )}
      </footer>
    </article>
  );
}
