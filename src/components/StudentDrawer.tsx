import { Link } from "@tanstack/react-router";
import { X, Heart, Languages, Shield, Target, History, MessageCircle, LifeBuoy } from "lucide-react";
import { useEffect } from "react";
import { isCald, type Student } from "@/lib/demo-data";
import { StudentAvatar } from "./StudentAvatar";
import { CaldBadge, NccdLevelBadge } from "./Badges";
import { useAppState } from "@/lib/app-state";

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="section-label">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  tone = "default",
}: {
  title: string;
  icon: typeof Heart;
  children: React.ReactNode;
  tone?: "default" | "success";
}) {
  return (
    <section
      className={`rounded-xl p-4 ${tone === "success" ? "bg-success-soft" : "bg-card shadow-warm-sm"}`}
    >
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon size={16} aria-hidden="true" />
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function StudentDrawer({
  student,
  onClose,
}: {
  student: Student | null;
  onClose: () => void;
}) {
  const { adjustments } = useAppState();

  useEffect(() => {
    if (!student) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [student, onClose]);

  if (!student) return null;
  const p = student.profile;
  const history = adjustments.filter((a) => a.studentId === student.id);

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close student profile"
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${student.preferredName} ${student.lastName} profile`}
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-background shadow-warm-lg sm:w-[560px]"
      >
        <header className="flex items-start gap-3 border-b border-border bg-card px-5 py-4">
          <StudentAvatar student={student} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-foreground">
              {student.firstName} {student.lastName}
            </h2>
            <p className="text-sm text-muted-foreground">
              Goes by {student.preferredName} · Year 8 · Year 8 Science B
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <NccdLevelBadge level={p.nccdLevel} />
              {isCald(student) && <CaldBadge label={p.culturalBackground ?? undefined} />}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-4">
            <Section title="Identity" icon={Languages}>
              <Field label="Cultural background" value={p.culturalBackground} />
              <Field label="Languages spoken" value={p.languagesSpoken} />
              {p.ealdLevel && p.ealdLevel !== "NA" && (
                <Field label="EAL/D level" value={p.ealdLevel} />
              )}
            </Section>

            <Section title="Needs" icon={Shield}>
              <Field label="NCCD category" value={`${p.nccdCategory} · ${p.nccdLevel}`} />
              <Field
                label="Primary diagnosis"
                value={p.primaryDiagnosis ?? "None disclosed"}
              />
              <Field label="What this looks like in class" value={p.functionalDescription} />
            </Section>

            <Section title="Context" icon={Heart}>
              <Field label="Trauma flags" value={p.traumaFlags ?? "None recorded"} />
              <Field label="Known triggers" value={p.knownTriggers} />
              <Field label="Calming strategies" value={p.calmingStrategies} />
              <Field label="Family communication" value={p.familyCommunicationPref} />
              <p className="text-xs text-muted-foreground">
                This is not a clinical tool. Flags are based on disclosed information only.
              </p>
            </Section>

            <Section title="Strengths" icon={Target} tone="success">
              <p className="text-sm text-foreground">{p.strengths}</p>
            </Section>

            <Section title="IEP goals" icon={Target}>
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                {(p.iepGoals ?? "").split(";").map((goal) => (
                  <li key={goal}>{goal.trim()}</li>
                ))}
              </ul>
            </Section>

            <Section title="Adjustment history" icon={History}>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No adjustments generated yet. Use the Lesson Planner to create the first one.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {history.slice(0, 5).map((a) => (
                    <li key={a.id} className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {a.status} ·{" "}
                        {new Date(a.createdAt).toLocaleDateString("en-AU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <p className="mt-1 line-clamp-3 text-sm text-foreground">
                        {a.generatedAdjustment}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>

        <footer className="flex flex-wrap gap-2 border-t border-border bg-card px-5 py-4">
          <Link
            to="/planner"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-light"
          >
            <Target size={16} aria-hidden="true" />
            Generate adjustment
          </Link>
          <Link
            to="/crisis"
            search={{ student: student.id }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            <LifeBuoy size={16} aria-hidden="true" />
            Crisis guidance
          </Link>
          <Link
            to="/family"
            search={{ student: student.id }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            <MessageCircle size={16} aria-hidden="true" />
            Family message
          </Link>
        </footer>

      </div>
    </div>
  );
}
