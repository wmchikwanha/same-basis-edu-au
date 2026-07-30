import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  LifeBuoy,
  Loader2,
  Ban,
  MessageSquareQuote,
  PhoneCall,
  HeartHandshake,
  ClipboardCheck,
  AlertTriangle,
  ListOrdered,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StudentAvatar } from "@/components/StudentAvatar";
import { AiBadge, NccdLevelBadge, TraumaBadge } from "@/components/Badges";
import { useAppState, newId, weekNumberFor } from "@/lib/app-state";
import { generateCrisisGuidance } from "@/lib/crisis.functions";
import type { CrisisGuidance } from "@/lib/ai-schemas";

export const Route = createFileRoute("/crisis")({
  validateSearch: (search: Record<string, unknown>) => ({
    student: typeof search.student === "string" ? search.student : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Moment-of-Crisis Guidance — Trauma-Informed Support | SameBasis" },
      {
        name: "description",
        content:
          "Calm, dignity-preserving guidance for a student in distress: what to do, what not to do, exact words to say and when to escalate.",
      },
      {
        property: "og:title",
        content: "Moment-of-Crisis Guidance — Trauma-Informed Support | SameBasis",
      },
      {
        property: "og:description",
        content:
          "Calm, dignity-preserving guidance for a student in distress: what to do, what not to do, exact words to say and when to escalate.",
      },
    ],
  }),
  component: CrisisPage,
});

const SETTINGS = [
  "Classroom, whole-class instruction",
  "Classroom, group or practical work",
  "Science laboratory / practical space",
  "Corridor or outside the classroom",
  "Playground or open area",
  "Assessment or exam conditions",
];

function GuidanceList({
  title,
  icon: Icon,
  items,
  tone,
  ordered,
  quoted,
}: {
  title: string;
  icon: typeof LifeBuoy;
  items: string[];
  tone: "primary" | "danger" | "accent" | "info";
  ordered?: boolean;
  quoted?: boolean;
}) {
  const tones = {
    primary: "bg-success-soft text-primary",
    danger: "bg-destructive/10 text-destructive",
    accent: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  } as const;
  const List = ordered ? "ol" : "ul";
  return (
    <section className="rounded-xl bg-card p-5 shadow-warm-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${tones[tone]}`}
          aria-hidden="true"
        >
          <Icon size={15} />
        </span>
        {title}
      </h3>
      <List className={`flex flex-col gap-2 ${ordered ? "list-decimal pl-5" : ""}`}>
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-foreground">
            {quoted ? <span className="italic">“{item.replace(/^"|"$/g, "")}”</span> : item}
          </li>
        ))}
      </List>
    </section>
  );
}

function CrisisPage() {
  const search = Route.useSearch();
  const { students, classes, addEvidenceLog } = useAppState();

  const [studentId, setStudentId] = useState(search.student ?? students[0]?.id ?? "");
  const [setting, setSetting] = useState(SETTINGS[0]);
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<CrisisGuidance | null>(null);
  const [logged, setLogged] = useState(false);

  const run = useServerFn(generateCrisisGuidance);
  const student = students.find((s) => s.id === studentId);
  const klass = classes.find((c) => c.id === student?.classId);

  async function handleGenerate() {
    if (!student) return;
    setLoading(true);
    setError(null);
    setGuidance(null);
    setLogged(false);
    const p = student.profile;
    const res = await run({
      data: {
        studentName: student.preferredName,
        yearLevel: klass?.yearLevel ?? 8,
        nccdCategory: p.nccdCategory,
        nccdLevel: p.nccdLevel,
        functionalDescription: p.primaryDiagnosis
          ? `${p.primaryDiagnosis}. ${p.functionalDescription}`
          : p.functionalDescription,
        culturalBackground: p.culturalBackground,
        languagesSpoken: p.languagesSpoken,
        traumaFlags: p.traumaFlags,
        knownTriggers: p.knownTriggers,
        calmingStrategies: p.calmingStrategies,
        strengths: p.strengths,
        situation,
        setting,
      },
    });
    if (res.ok) setGuidance(res.result);
    else setError(res.error);
    setLoading(false);
  }

  function logMonitoring() {
    if (!student || !guidance) return;
    const now = new Date();
    addEvidenceLog({
      id: newId("evi"),
      adjustmentId: null,
      studentId: student.id,
      logDate: now.toISOString().slice(0, 10),
      weekNumber: weekNumberFor(now),
      pillar: "Monitoring",
      evidenceSummary: `Regulation support (${setting}). ${guidance.documentation_note}`,
      source: "teacher-recorded",
      createdAt: now.toISOString(),
    });
    setLogged(true);
    toast.success(`Logged for ${student.preferredName}`, {
      description: "Recorded against the NCCD Monitoring pillar.",
    });
  }

  return (
    <AppShell
      title="Moment-of-Crisis Guidance"
      description="For the moment a student is dysregulated and you need a calm, dignity-preserving next step."
    >
      <div className="flex flex-col gap-6">
        <p
          role="note"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/8 p-4 text-sm leading-relaxed text-foreground"
        >
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-destructive" aria-hidden="true" />
          <span>
            <strong className="font-semibold">If anyone is in immediate danger, stop and act.</strong>{" "}
            Follow your school's emergency response, call the executive or first aid, and dial 000 if
            required. This page supports low-level de-escalation and reflection — it is not an
            emergency service and it is not clinical advice.
          </span>
        </p>

        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <h2 className="text-lg font-semibold text-foreground">What is happening?</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="section-label">Student</span>
              <select
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setGuidance(null);
                }}
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
              <span className="section-label">Setting</span>
              <select
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                className="min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm"
              >
                {SETTINGS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="section-label">Describe the moment (optional)</span>
              <textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                rows={3}
                placeholder="e.g. Refused to join the group task, head down on the desk, not responding to prompts"
                className="rounded-lg border border-input bg-background p-3 text-sm"
              />
            </label>
          </div>

          {student && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-muted/60 p-4">
              <StudentAvatar student={student} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {student.preferredName} {student.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Known triggers: {student.profile.knownTriggers ?? "None recorded"}
                </p>
                <p className="text-xs text-muted-foreground">
                  What helps: {student.profile.calmingStrategies ?? "None recorded"}
                </p>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <NccdLevelBadge level={student.profile.nccdLevel} />
                {student.profile.traumaFlags && <TraumaBadge />}
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !student}
            className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <LifeBuoy size={18} aria-hidden="true" />
            )}
            {loading ? "Thinking it through calmly…" : "Get guidance now"}
          </button>

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

        {guidance && student && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                Guidance for {student.preferredName}
              </h2>
              <AiBadge />
            </div>

            <GuidanceList
              title="Right now — the next few minutes"
              icon={ListOrdered}
              items={guidance.immediate_steps}
              tone="primary"
              ordered
            />
            <GuidanceList
              title="What NOT to do"
              icon={Ban}
              items={guidance.what_not_to_do}
              tone="danger"
            />
            <GuidanceList
              title="Words you can use"
              icon={MessageSquareQuote}
              items={guidance.language_to_use}
              tone="info"
              quoted
            />
            <GuidanceList
              title="Escalate and call for support if…"
              icon={PhoneCall}
              items={guidance.escalation_criteria}
              tone="accent"
            />
            <GuidanceList
              title="Afterwards — repair and re-entry"
              icon={HeartHandshake}
              items={guidance.after_the_moment}
              tone="primary"
            />

            <section className="rounded-xl bg-card p-5 shadow-warm-sm">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <ClipboardCheck size={16} aria-hidden="true" />
                Documentation note
              </h3>
              <p className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed text-foreground">
                {guidance.documentation_note}
              </p>
              <button
                onClick={logMonitoring}
                disabled={logged}
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-60"
              >
                <ClipboardCheck size={18} aria-hidden="true" />
                {logged ? "Logged to Monitoring evidence" : "Log to Monitoring evidence"}
              </button>
              <p className="mt-3 text-xs text-muted-foreground">
                Nothing is recorded unless you choose to log it. Review the wording against your
                school's incident reporting policy before it becomes formal evidence.
              </p>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
