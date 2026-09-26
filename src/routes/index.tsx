import { useAppState } from "@/lib/app-state";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Info, Loader2, GraduationCap, Building2 } from "lucide-react";
import { enterSandbox, type SandboxRole } from "@/lib/sandbox";
import {
  ArrowRight,
  ClipboardCheck,
  HeartPulse,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { brand, footerText } from "@/lib/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SameBasis | Inclusive teaching adjustments for Australian classrooms" },
      {
        name: "description",
        content:
          "SameBasis turns disability, cultural and trauma context into practical, NCCD-ready classroom adjustments — generated in seconds and always teacher-reviewed.",
      },
      {
        property: "og:title",
        content: "SameBasis | Inclusive teaching adjustments, ready for the next lesson",
      },
      {
        property: "og:description",
        content:
          "Moment-specific adjustments, crisis guidance, family messages and NCCD evidence in one warm, teacher-controlled tool.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Sparkles,
    title: "Adjustment generator",
    body: "Pick a class and a curriculum topic. Get one specific, usable adjustment per student — with the UDL benefit, the cultural read and the trauma read spelled out.",
  },
  {
    icon: HeartPulse,
    title: "Moment-of-crisis guidance",
    body: "Trauma-informed steps, the exact words to use, what not to do, and clear escalation criteria for the student in front of you.",
  },
  {
    icon: MessageCircle,
    title: "Family communication",
    body: "Strengths-first messages home in plain English, shaped by each family's language and communication preference.",
  },
  {
    icon: ClipboardCheck,
    title: "NCCD evidence, automatically",
    body: "Every adjustment you implement becomes a dated evidence entry across the four NCCD pillars, exportable for census.",
  },
];

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1120px] items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            SB
          </span>
          <span className="flex-1 text-base font-semibold text-foreground">{brand.name}</span>
          <Link
            to="/auth"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Sign in with an account
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 sm:px-6">
        <section className="py-14 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Australian classrooms · NCCD ready
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-foreground sm:text-5xl">
            Every student. Same basis for learning.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {brand.positioning} SameBasis reads the whole child — disability, culture, trauma and
            strengths — and hands you one adjustment you can actually use in the next lesson.
          </p>
          <RolePicker />
        </section>

        <section aria-label="What SameBasis does" className="grid gap-6 pb-16 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-xl bg-card p-6 shadow-warm-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </section>

        <section className="mb-16 rounded-xl bg-secondary/50 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">
            The teacher decides. Always.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Nothing is auto-implemented. Every suggestion is editable, and you choose to implement,
            modify, save or decline it. SameBasis is decision support for a qualified teacher — not
            a diagnosis, not legal advice, and never a replacement for your professional judgement
            or your school's learning support team.
          </p>
        </section>
      </main>

      <footer className="border-t border-border/70 px-4 py-6 sm:px-6">
        <p className="mx-auto max-w-[1120px] text-center text-xs text-muted-foreground">
          {footerText}
        </p>
      </footer>
    </div>
  );
}

function RolePicker() {
  const navigate = useNavigate();
  const { refresh } = useAppState();
  const [busy, setBusy] = useState<SandboxRole | null>(null);

  async function choose(role: SandboxRole) {
    setBusy(role);
    try {
      await enterSandbox(role);
      await refresh();
      await refresh();
      await navigate({ to: role === "admin" ? "/admin" : "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't open the sandbox.");
      setBusy(null);
    }
  }

  const roles = [
    {
      role: "teacher" as const,
      icon: GraduationCap,
      title: "Enter as Teacher",
      body: "Your own classroom, pre-populated with six synthetic student profiles. Plan lessons, generate adjustments, message families and log NCCD evidence.",
    },
    {
      role: "admin" as const,
      icon: Building2,
      title: "Enter as School Admin",
      body: "Head-of-school console: oversee three synthetic teachers, create teacher accounts, manage students across the whole school, and audit AI use with an append-only governance log and zero-discrimination equity monitoring.",
    },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">Choose your role to start</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        No sign-up, no email, no verification — a private sandbox opens instantly.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {roles.map(({ role, icon: Icon, title, body }) => (
          <button
            key={role}
            type="button"
            disabled={busy !== null}
            onClick={() => choose(role)}
            className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6 text-left shadow-warm-sm transition-colors hover:border-primary disabled:opacity-60"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
              {busy === role ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : <Icon size={20} aria-hidden="true" />}
            </span>
            <span className="flex items-center gap-2 text-lg font-semibold text-foreground">
              {title} <ArrowRight size={18} aria-hidden="true" />
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">{body}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 flex gap-3 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-foreground" role="note">
        <Info size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <p>
          <span className="font-semibold">Privacy note:</span> You can use temporary email
          addresses, e.g. test@mail.com, for instant testing with no verification steps required.
          Just note that different account types require separate email addresses.
        </p>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        By entering you consent to AI processing of the synthetic student context, used only when
        you press Generate. Suggestions are drafts to review, edit or decline. Student profiles are
        synthetic — never enter real student information.
      </p>
    </div>
  );
}
