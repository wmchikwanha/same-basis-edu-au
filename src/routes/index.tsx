import { createFileRoute, Link } from "@tanstack/react-router";
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
            className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light"
          >
            Try the demo
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
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-light"
            >
              Start free — no verification
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex min-h-[48px] items-center rounded-lg border border-input bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            Trial accounts open instantly with a temporary email address. All student data in the
            trial is synthetic.
          </p>
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
