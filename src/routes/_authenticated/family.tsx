import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  MessageCircle,
  Loader2,
  AlertTriangle,
  Copy,
  Languages,
  Globe2,
  CalendarClock,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StudentAvatar } from "@/components/StudentAvatar";
import { AiBadge, CaldBadge } from "@/components/Badges";
import { useAppState, newId, weekNumberFor } from "@/lib/app-state";
import { generateFamilyMessage } from "@/lib/family.functions";
import type { FamilyMessage } from "@/lib/ai-schemas";
import { isCald } from "@/lib/demo-data";
import { demoUser } from "@/lib/brand";

export const Route = createFileRoute("/_authenticated/family")({
  validateSearch: (search: Record<string, unknown>) => ({
    student: typeof search.student === "string" ? search.student : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Family Communication — Plain-English Messages Home | SameBasis" },
      {
        name: "description",
        content:
          "Draft warm, jargon-free, culturally respectful messages to families about the adjustments in place, and log them as NCCD consultation evidence.",
      },
      {
        property: "og:title",
        content: "Family Communication — Plain-English Messages Home | SameBasis",
      },
      {
        property: "og:description",
        content:
          "Draft warm, jargon-free, culturally respectful messages to families about the adjustments in place, and log them as NCCD consultation evidence.",
      },
    ],
  }),
  component: FamilyPage,
});

const PURPOSES = [
  "Introduce the adjustments now in place in class",
  "Share a recent success or piece of progress",
  "Invite the family to a planning conversation about goals",
  "Check in after a difficult week",
  "Ask about strategies that work well at home",
  "Confirm agreement before changing an adjustment",
];

function isMeaningful(note: string) {
  return !!note && !/^no specific/i.test(note.trim());
}

function FamilyPage() {
  const search = Route.useSearch();
  const { students, classes, adjustments, addEvidenceLog } = useAppState();

  const [studentId, setStudentId] = useState(search.student ?? students[0]?.id ?? "");
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<FamilyMessage | null>(null);
  const [body, setBody] = useState("");
  const [logged, setLogged] = useState(false);

  const run = useServerFn(generateFamilyMessage);
  const student = students.find((s) => s.id === studentId);
  const klass = classes.find((c) => c.id === student?.classId);
  const studentAdjustments = adjustments.filter(
    (a) => a.studentId === studentId && (a.status === "implemented" || a.status === "modified"),
  );

  async function handleGenerate() {
    if (!student) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    setLogged(false);
    const p = student.profile;
    const res = await run({
      data: {
        studentName: student.preferredName,
        fullName: `${student.firstName} ${student.lastName}`,
        yearLevel: klass?.yearLevel ?? 8,
        subject: klass?.subject ?? "Science",
        purpose,
        culturalBackground: p.culturalBackground,
        languagesSpoken: p.languagesSpoken,
        familyCommunicationPref: p.familyCommunicationPref,
        strengths: p.strengths,
        iepGoals: p.iepGoals,
        adjustmentsSummary: studentAdjustments
          .slice(0, 3)
          .map((a) => a.generatedAdjustment)
          .join(" | "),
        teacherNotes: notes,
        teacherName: demoUser.fullName,
        schoolName: demoUser.schoolName,
      },
    });
    if (res.ok) {
      setMessage(res.result);
      setBody(res.result.message_body);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }

  async function copyMessage() {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(`${message.subject_line}\n\n${body}`);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy — select the text and copy manually.");
    }
  }

  function logConsultation() {
    if (!student || !message) return;
    const now = new Date();
    addEvidenceLog({
      id: newId("evi"),
      adjustmentId: null,
      studentId: student.id,
      logDate: now.toISOString().slice(0, 10),
      weekNumber: weekNumberFor(now),
      pillar: "Consultation",
      evidenceSummary: `Message home — ${message.subject_line}. Purpose: ${purpose}.`,
      source: body === message.message_body ? "AI-generated" : "teacher-edited",
      createdAt: now.toISOString(),
    });
    setLogged(true);
    toast.success(`Logged for ${student.preferredName}`, {
      description: "Recorded against the NCCD Consultation pillar.",
    });
  }

  return (
    <AppShell
      title="Family Communication"
      description="Plain-English, strengths-first messages home. Consultation is a conversation, not a notification."
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <h2 className="text-lg font-semibold text-foreground">Who are you writing to?</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="section-label">Student</span>
              <select
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setMessage(null);
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
              <span className="section-label">Purpose</span>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm"
              >
                {PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="section-label">Anything you want mentioned (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. She presented her group's findings to the class on Thursday and did it beautifully"
                className="rounded-lg border border-input bg-background p-3 text-sm"
              />
            </label>
          </div>

          {student && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-muted/60 p-4">
              <StudentAvatar student={student} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {student.firstName} {student.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Family preference: {student.profile.familyCommunicationPref ?? "Not recorded"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {studentAdjustments.length}{" "}
                  {studentAdjustments.length === 1 ? "adjustment" : "adjustments"} in place will be
                  referenced
                </p>
              </div>
              {isCald(student) && (
                <div className="ml-auto">
                  <CaldBadge label={student.profile.culturalBackground ?? undefined} />
                </div>
              )}
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
              <MessageCircle size={18} aria-hidden="true" />
            )}
            {loading ? "Choosing the words carefully…" : "Draft the message"}
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

        {message && student && (
          <section className="rounded-xl bg-card p-6 shadow-warm-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-foreground">Draft message</h2>
              <AiBadge label="AI-drafted" />
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <div>
                <p className="section-label">Subject</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {message.subject_line}
                </p>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="section-label">Message (editable before you send)</span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="rounded-lg border border-input bg-background p-4 text-sm leading-relaxed"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                {isMeaningful(message.translation_note) && (
                  <p className="flex items-start gap-2 rounded-lg bg-info-soft p-3 text-sm text-info">
                    <Languages size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {message.translation_note}
                  </p>
                )}
                {isMeaningful(message.cultural_note) && (
                  <p className="flex items-start gap-2 rounded-lg bg-accent/20 p-3 text-sm text-foreground">
                    <Globe2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {message.cultural_note}
                  </p>
                )}
                <p className="flex items-start gap-2 rounded-lg bg-muted/70 p-3 text-sm text-muted-foreground sm:col-span-2">
                  <CalendarClock size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {message.suggested_followup}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyMessage}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-warm-sm hover:bg-muted"
                >
                  <Copy size={18} aria-hidden="true" />
                  Copy message
                </button>
                <button
                  onClick={logConsultation}
                  disabled={logged}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-60"
                >
                  <ClipboardCheck size={18} aria-hidden="true" />
                  {logged ? "Logged to Consultation evidence" : "Log as consultation evidence"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Read it in your own voice before sending. Nothing is sent from SameBasis and nothing
                is logged unless you choose to log it.
              </p>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
