import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RotateCcw, User, School, Info, Save, Sparkles, Compass, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { startGuidedTour } from "@/components/GuidedTour";
import { useAppState } from "@/lib/app-state";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — School, Year Level and AI Consent | SameBasis" },
      {
        name: "description",
        content:
          "Edit your school name, year level and assessment context so generated adjustments and evidence packs match your setting, and manage AI processing consent.",
      },
      { property: "og:title", content: "Settings — School, Year Level and AI Consent | SameBasis" },
      {
        property: "og:description",
        content:
          "Edit your school name, year level and assessment context, review how AI is used, and reset your trial workspace.",
      },
    ],
  }),
  component: SettingsPage,
});

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

function SettingsPage() {
  const { profile, adjustments, evidenceLogs, resetDemo, saveProfile } = useAppState();

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [state, setState] = useState("NSW");
  const [yearLevel, setYearLevel] = useState(8);
  const [assessmentContext, setAssessmentContext] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setRole(profile.role);
    setSchoolName(profile.schoolName);
    setState(profile.state);
    setYearLevel(profile.yearLevel);
    setAssessmentContext(profile.assessmentContext);
  }, [profile]);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await saveProfile({ fullName, role, schoolName, state, yearLevel, assessmentContext });
      toast.success("Settings saved", {
        description: "New adjustments and evidence packs will use this context.",
      });
    } catch {
      toast.error("We couldn't save those settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleConsent(next: boolean) {
    try {
      await saveProfile({ aiConsent: next });
      toast.success(next ? "AI processing consent recorded." : "AI processing consent withdrawn.");
    } catch {
      toast.error("We couldn't update your consent. Please try again.");
    }
  }

  const inputClass =
    "min-h-[44px] rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <AppShell title="Settings" description="Your account, school context and AI consent.">
      <div className="flex max-w-2xl flex-col gap-6">
        <form onSubmit={onSave} className="flex flex-col gap-6">
          <section className="rounded-xl bg-card p-6 shadow-warm-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <User size={20} className="text-primary" aria-hidden="true" />
              Account
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="section-label">Name</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={80}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="section-label">Role</span>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  maxLength={60}
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl bg-card p-6 shadow-warm-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <School size={20} className="text-primary" aria-hidden="true" />
              School and teaching context
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This context is written into every generated adjustment and appears on your evidence
              pack exports.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="section-label">School name</span>
                <input
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  maxLength={120}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="section-label">Jurisdiction</span>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={inputClass}
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="section-label">Year level</span>
                <select
                  value={yearLevel}
                  onChange={(e) => setYearLevel(Number(e.target.value))}
                  className={inputClass}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="section-label">Assessment context</span>
                <textarea
                  value={assessmentContext}
                  onChange={(e) => setAssessmentContext(e.target.value)}
                  rows={4}
                  maxLength={600}
                  placeholder="e.g. Term 3 depth study, 400-word scientific report, marked against the NSW Stage 4 Science outcomes. Practicals run in double periods."
                  className="rounded-lg border border-input bg-background p-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-xs text-muted-foreground">
                  {assessmentContext.length}/600 characters
                </span>
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-[44px] w-fit items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-60"
          >
            <Save size={18} aria-hidden="true" />
            {saving ? "Saving…" : "Save settings"}
          </button>
        </form>

        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Sparkles size={20} className="text-primary" aria-hidden="true" />
            AI processing consent
          </h2>
          <div className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">When AI is used:</strong> only when you press
              Generate in the Lesson Planner, Crisis Guidance or Family Messages. Nothing is sent
              in the background, and browsing student profiles or the evidence log involves no AI.
            </p>
            <p>
              <strong className="text-foreground">What is sent:</strong> the student profile fields
              shown on screen (functional impact, cultural and trauma context, strengths and
              goals), your class, topic and assessment context. Never enter real, identifying
              student information during the trial.
            </p>
            <p>
              <strong className="text-foreground">Limitations to review:</strong> output is a
              suggestion, not a professional judgement. It can be generic, occasionally wrong, and
              cannot see your classroom. Read every suggestion in full, edit anything that does not
              fit, and decline what is not appropriate — nothing becomes evidence until you
              implement it.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={
                profile?.aiConsent
                  ? "inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-primary"
                  : "inline-flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning"
              }
            >
              <ShieldCheck size={14} aria-hidden="true" />
              {profile?.aiConsent ? "Consent given" : "Consent not yet given"}
              {profile?.aiConsent && profile.aiConsentAt
                ? ` · ${new Date(profile.aiConsentAt).toLocaleDateString("en-AU")}`
                : ""}
            </span>
            <button
              type="button"
              onClick={() => toggleConsent(!profile?.aiConsent)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              {profile?.aiConsent ? "Withdraw consent" : "I consent to AI processing"}
            </button>
            <Link
              to="/help"
              className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              Read the full AI limitations
            </Link>
          </div>
        </section>

        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Compass size={20} className="text-primary" aria-hidden="true" />
            Guided tour
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A 30-second walkthrough of the Lesson Planner, Evidence Log and Family Messages.
          </p>
          <button
            type="button"
            onClick={startGuidedTour}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <Compass size={18} aria-hidden="true" />
            Replay the tour
          </button>
        </section>

        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <RotateCcw size={20} className="text-primary" aria-hidden="true" />
            Reset trial data
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You currently have {adjustments.length}{" "}
            {adjustments.length === 1 ? "adjustment" : "adjustments"} and {evidenceLogs.length}{" "}
            {evidenceLogs.length === 1 ? "evidence entry" : "evidence entries"} saved to your
            account. Resetting clears them and rebuilds the starting classroom.
          </p>
          <button
            type="button"
            onClick={() => {
              void resetDemo().then(() =>
                toast.success("Workspace reset", {
                  description: "All saved adjustments and evidence have been cleared.",
                }),
              );
            }}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-destructive/40 px-5 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            <RotateCcw size={18} aria-hidden="true" />
            Reset trial data
          </button>
        </section>

        <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          Your workspace is private to your account. All students in this trial are synthetic —
          never enter real student information.
        </p>
      </div>
    </AppShell>
  );
}
