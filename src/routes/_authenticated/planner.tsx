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
  RefreshCw,
  Undo2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StudentAvatar } from "@/components/StudentAvatar";
import { AiBadge, CaldBadge, NccdLevelBadge, PillarBadge } from "@/components/Badges";
import { useAppState, newId, weekNumberFor } from "@/lib/app-state";
import { generateAdjustment } from "@/lib/adjustments.functions";
import { recordActivity } from "@/lib/activity";
import { isCald, type AdjustmentRecord, type Student } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Lesson Planner — Generate Reasonable Adjustments | SameBasis" },
      {
        name: "description",
        content:
          "Choose a class and curriculum topic and get specific, evidence-based reasonable adjustments for each student, reviewed side-by-side before anything is saved.",
      },
      {
        property: "og:title",
        content: "Lesson Planner — Generate Reasonable Adjustments | SameBasis",
      },
      {
        property: "og:description",
        content:
          "Generate, review, edit or regenerate each student's adjustment side-by-side with the original AI output before it becomes NCCD evidence.",
      },
    ],
  }),
  component: Planner,
});

type DraftBody = {
  adjustment: string;
  udlBenefit: string;
  culturalNote: string;
  traumaNote: string;
  rationale: string;
};

type Draft = {
  studentId: string;
  original: DraftBody;
  current: DraftBody;
  regenCount: number;
};

function isEdited(draft: Draft): boolean {
  return (Object.keys(draft.original) as (keyof DraftBody)[]).some(
    (key) => draft.original[key] !== draft.current[key],
  );
}

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
  const { profile, classes, students, topics, addAdjustment, addEvidenceLog } = useAppState();
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
  const [regeneratingIds, setRegeneratingIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState<null | "accept" | "regenerate">(null);
  const [handled, setHandled] = useState<Record<string, "implemented" | "declined" | "saved">>({});
  const [error, setError] = useState<string | null>(null);

  const klass = classes.find((c) => c.id === classId);
  const topic = topics.find((t) => t.id === topicId);

  function toggleStudent(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function generateFor(student: Student): Promise<DraftBody | { error: string }> {
    if (!klass || !topic) return { error: "Select a class and topic first." };
    const p = student.profile;
    const started = performance.now();
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

    const durationMs = Math.round(performance.now() - started);

    if (!res.ok) {
      const timedOut = /timeout|timed out|504|aborted/i.test(res.error);
      recordActivity({
        eventType: timedOut ? "timeout" : "error",
        surface: "planner",
        studentId: student.id,
        summary: `${student.preferredName}: ${res.error}`.slice(0, 500),
        durationMs,
        success: false,
      });
      return { error: res.error };
    }

    recordActivity({
      eventType: "generated",
      surface: "planner",
      studentId: student.id,
      summary: `${topic.topic} — adjustment generated for ${student.preferredName}.`,
      durationMs,
    });

    return {
      adjustment: res.result.adjustment,
      udlBenefit: res.result.udl_benefit,
      culturalNote: res.result.cultural_note,
      traumaNote: res.result.trauma_note,
      rationale: res.result.rationale,
    };
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
        const body = await generateFor(student);
        if ("error" in body) {
          failure = body.error;
          return;
        }
        collected.push({
          studentId: student.id,
          original: body,
          current: { ...body },
          regenCount: 0,
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

  async function handleRegenerate(draft: Draft, silent = false) {
    const student = students.find((s) => s.id === draft.studentId);
    if (!student || !topic) return;
    setRegeneratingIds((prev) => [...prev, draft.studentId]);
    const body = await generateFor(student);
    setRegeneratingIds((prev) => prev.filter((id) => id !== draft.studentId));
    if ("error" in body) {
      if (!silent) toast.error(body.error);
      return;
    }
    recordActivity({
      eventType: "regenerated",
      surface: "planner",
      studentId: student.id,
      summary: `${topic.topic} — regenerated (attempt ${draft.regenCount + 2}) for ${student.preferredName}.`,
    });
    setDrafts((prev) =>
      prev.map((d) =>
        d.studentId === draft.studentId
          ? { studentId: d.studentId, original: body, current: { ...body }, regenCount: d.regenCount + 1 }
          : d,
      ),
    );
    setEditingId(null);
    if (!silent) toast.success(`New suggestion for ${student.preferredName}`);
  }

  async function bulkRegenerate() {
    const pending = drafts.filter((d) => !handled[d.studentId]);
    if (pending.length === 0) return;
    setBulkBusy("regenerate");
    let cursor = 0;
    const worker = async () => {
      while (cursor < pending.length) {
        await handleRegenerate(pending[cursor++], true);
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, pending.length) }, worker));
    setBulkBusy(null);
    toast.success(`Regenerated ${pending.length} outputs`, {
      description: "Review each one — exceptions can still be edited or declined individually.",
    });
  }

  function bulkAccept() {
    const pending = drafts.filter((d) => !handled[d.studentId]);
    if (pending.length === 0) return;
    setBulkBusy("accept");
    for (const draft of pending) commit(draft, "implemented", true);
    recordActivity({
      eventType: "accepted",
      surface: "planner",
      summary: `Bulk accepted ${pending.length} AI outputs for ${topic?.topic ?? "this lesson"}.`,
    });
    setBulkBusy(null);
    toast.success(`Accepted ${pending.length} adjustments`, {
      description: "All logged against the NCCD Adjustment pillar.",
    });
  }

  function commit(
    draft: Draft,
    status: "implemented" | "declined" | "saved",
    silent = false,
  ) {
    const student = students.find((s) => s.id === draft.studentId);
    if (!student || !klass || !topic) return;
    const now = new Date();
    const edited = isEdited(draft);
    const body = draft.current;

    const record: AdjustmentRecord = {
      id: newId("adj"),
      studentId: draft.studentId,
      classId: klass.id,
      curriculumTopicId: topic.id,
      activityDescription: activity,
      generatedAdjustment: body.adjustment,
      udlBenefit: body.udlBenefit,
      culturalNote: isNoteMeaningful(body.culturalNote) ? body.culturalNote : null,
      traumaNote: isNoteMeaningful(body.traumaNote) ? body.traumaNote : null,
      rationale: body.rationale,
      nccdPillar: "Adjustment",
      evidenceType: student.profile.nccdLevel,
      teacherAction: null,
      status: status === "implemented" && edited ? "modified" : status,
      createdAt: now.toISOString(),
      implementedAt: status === "implemented" ? now.toISOString() : null,
    };
    addAdjustment(record);

    if (edited) {
      recordActivity({
        eventType: "edited",
        surface: "planner",
        studentId: student.id,
        adjustmentId: record.id,
        summary: `Teacher edited the AI wording before ${status === "implemented" ? "accepting" : status}.`,
      });
    }

    recordActivity({
      eventType:
        status === "implemented" ? "accepted" : status === "declined" ? "declined" : "saved",
      surface: "planner",
      studentId: student.id,
      adjustmentId: record.id,
      summary: `${topic.topic} — ${status === "implemented" ? "accepted and logged as NCCD evidence" : status === "declined" ? "declined, nothing logged" : "saved for later"}.`,
    });

    if (status === "implemented") {
      addEvidenceLog({
        id: newId("evi"),
        adjustmentId: record.id,
        studentId: student.id,
        logDate: now.toISOString().slice(0, 10),
        weekNumber: weekNumberFor(now),
        pillar: "Adjustment",
        evidenceSummary: `${topic.topic}: ${body.adjustment}`,
        source: edited ? "teacher-edited" : "AI-generated",
        createdAt: now.toISOString(),
      });
      if (!silent)
        toast.success(`Logged for ${student.preferredName}`, {
          description: "Evidence recorded against the NCCD Adjustment pillar.",
        });
    } else if (status === "saved") {
      if (!silent) toast.success(`Saved for later — ${student.preferredName}`);
    } else if (!silent) {
      toast(`Declined for ${student.preferredName}`, {
        description: "Nothing was logged as evidence.",
      });
    }

    setHandled((prev) => ({ ...prev, [draft.studentId]: status }));
    setEditingId(null);
  }

  const reviewed = Object.keys(handled).length;

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
              title="Review before saving"
              hint="The original AI output stays on the left. Edit, regenerate or accept each student — nothing is saved until you decide."
            />
            <div className="mb-4 flex flex-col gap-3 rounded-xl bg-muted/60 p-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText size={16} aria-hidden="true" />
                <span>
                  {reviewed} of {drafts.length} reviewed
                  {pendingCount > 0 ? ` · ${pendingCount} still to decide` : " · all decided"}. Every
                  generate, edit, regenerate and accept is written to the audit trail in Settings.
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={bulkAccept}
                  disabled={pendingCount === 0 || bulkBusy !== null}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-60"
                >
                  {bulkBusy === "accept" ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <CheckCheck size={16} aria-hidden="true" />
                  )}
                  Accept all remaining ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => void bulkRegenerate()}
                  disabled={pendingCount === 0 || bulkBusy !== null}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
                >
                  {bulkBusy === "regenerate" ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw size={16} aria-hidden="true" />
                  )}
                  Regenerate all remaining
                </button>
                <span className="text-xs text-muted-foreground">
                  Bulk actions only touch outputs you haven't decided on — handle exceptions
                  individually below first.
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {drafts.map((draft) => {
                const student = students.find((s) => s.id === draft.studentId)!;
                return (
                  <ReviewCard
                    key={draft.studentId}
                    student={student}
                    draft={draft}
                    editing={editingId === draft.studentId}
                    regenerating={regeneratingId === draft.studentId}
                    outcome={handled[draft.studentId]}
                    onEdit={() => setEditingId(draft.studentId)}
                    onStopEditing={() => setEditingId(null)}
                    onRevert={() =>
                      setDrafts((prev) =>
                        prev.map((d) =>
                          d.studentId === draft.studentId
                            ? { ...d, current: { ...d.original } }
                            : d,
                        ),
                      )
                    }
                    onRegenerate={() => void handleRegenerate(draft)}
                    onChange={(patch) =>
                      setDrafts((prev) =>
                        prev.map((d) =>
                          d.studentId === draft.studentId
                            ? { ...d, current: { ...d.current, ...patch } }
                            : d,
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
                Accepted adjustments are timestamped and written to the Evidence Log against the
                NCCD Adjustment pillar.
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

function ReviewCard({
  student,
  draft,
  editing,
  regenerating,
  outcome,
  onEdit,
  onStopEditing,
  onRevert,
  onRegenerate,
  onChange,
  onCommit,
}: {
  student: Student;
  draft: Draft;
  editing: boolean;
  regenerating: boolean;
  outcome?: "implemented" | "declined" | "saved";
  onEdit: () => void;
  onStopEditing: () => void;
  onRevert: () => void;
  onRegenerate: () => void;
  onChange: (patch: Partial<DraftBody>) => void;
  onCommit: (status: "implemented" | "declined" | "saved") => void;
}) {
  const body = draft.current;
  const edited = isEdited(draft);
  const showCultural = isNoteMeaningful(body.culturalNote);
  const showTrauma = isNoteMeaningful(body.traumaNote);

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
          {draft.regenCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Regenerated ×{draft.regenCount}
            </span>
          )}
          {edited && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/30 px-3 py-1 text-xs font-medium text-foreground">
              Edited by you
            </span>
          )}
        </div>
      </header>

      {/* Side-by-side review: original AI output vs. the version that will be saved */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="section-label mb-2">Original AI output</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {draft.original.adjustment}
          </p>
        </div>
        <div className="rounded-lg border border-primary/40 bg-background p-4">
          <p className="section-label mb-2">
            {edited ? "Your version (this is what gets saved)" : "This is what gets saved"}
          </p>
          {editing ? (
            <textarea
              value={body.adjustment}
              onChange={(e) => onChange({ adjustment: e.target.value })}
              rows={8}
              aria-label={`Edit adjustment for ${student.preferredName}`}
              className="w-full rounded-lg border border-input bg-background p-3 text-sm"
            />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {body.adjustment}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div className="rounded-lg bg-success-soft p-4">
          <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-primary">
            <Users2 size={14} aria-hidden="true" />
            This also supports
          </p>
          {editing ? (
            <textarea
              value={body.udlBenefit}
              onChange={(e) => onChange({ udlBenefit: e.target.value })}
              rows={2}
              aria-label={`Edit UDL benefit for ${student.preferredName}`}
              className="w-full rounded-lg border border-input bg-background p-2 text-sm"
            />
          ) : (
            <p className="text-sm text-foreground">{body.udlBenefit}</p>
          )}
        </div>

        {showCultural && (
          <div className="rounded-lg bg-accent/20 p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-foreground">
              <Globe2 size={14} aria-hidden="true" />
              Cultural consideration
            </p>
            <p className="text-sm text-foreground">{body.culturalNote}</p>
          </div>
        )}

        {showTrauma && (
          <div className="rounded-lg bg-warning-soft p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-warning">
              <ShieldAlert size={14} aria-hidden="true" />
              Trauma-informed note
            </p>
            <p className="text-sm text-foreground">{body.traumaNote}</p>
          </div>
        )}

        <p className="text-sm italic text-muted-foreground">Why: {body.rationale}</p>

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
              ? "Accepted and logged as NCCD evidence."
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
              {edited ? "Accept my version" : "Accept as is"}
            </button>
            <button
              onClick={editing ? onStopEditing : onEdit}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Pencil size={16} aria-hidden="true" />
              {editing ? "Done editing" : "Edit"}
            </button>
            <button
              onClick={onRegenerate}
              disabled={regenerating}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
            >
              {regenerating ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw size={16} aria-hidden="true" />
              )}
              {regenerating ? "Regenerating…" : "Regenerate"}
            </button>
            {edited && (
              <button
                onClick={onRevert}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                <Undo2 size={16} aria-hidden="true" />
                Revert to AI original
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
