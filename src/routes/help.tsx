import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ShieldCheck, Sparkles, Scale, LifeBuoy } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Info — How SameBasis Works" },
      {
        name: "description",
        content:
          "How SameBasis generates reasonable adjustments, what the NCCD four pillars mean, and how teacher judgment and privacy are protected.",
      },
      { property: "og:title", content: "Help & Info — How SameBasis Works" },
      {
        property: "og:description",
        content:
          "How SameBasis generates reasonable adjustments, what the NCCD four pillars mean, and how teacher judgment and privacy are protected.",
      },
    ],
  }),
  component: HelpPage,
});

const pillars = [
  {
    name: "Consultation",
    text: "Evidence that the school consulted the student, their family or specialists about the adjustments provided.",
  },
  {
    name: "Adjustment",
    text: "Evidence that personalised adjustments were actually provided in class. Every adjustment you implement here lands in this pillar.",
  },
  {
    name: "Monitoring",
    text: "Evidence that the impact of the adjustment on the student's participation and learning was observed over time.",
  },
  {
    name: "Review",
    text: "Evidence that adjustments were reviewed and changed when they were no longer the right fit.",
  },
];

const faqs = [
  {
    q: "Does SameBasis decide anything for me?",
    a: "No. SameBasis suggests. You are the professional in the room and every suggestion is editable, declinable and never logged as evidence unless you implement it.",
  },
  {
    q: "Where do the adjustments come from?",
    a: "Each suggestion is generated against the student's disclosed profile, the NCCD level of adjustment, Universal Design for Learning principles, trauma-informed practice and the specific Australian Curriculum content you are teaching.",
  },
  {
    q: "Is this a clinical or diagnostic tool?",
    a: "No. Profiles are teacher-facing summaries of information already disclosed to the school. SameBasis does not diagnose, assess or store clinical records.",
  },
  {
    q: "How does this help at NCCD census time?",
    a: "Implemented adjustments are timestamped and auto-tagged by pillar, so the evidence you need already exists as a by-product of teaching, rather than being reconstructed in the last fortnight.",
  },
];

function HelpPage() {
  return (
    <AppShell
      title="Help & Info"
      description="What SameBasis is, what it is not, and how the evidence fits together."
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Scale size={20} className="text-primary" aria-hidden="true" />
            Why "SameBasis"
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The Disability Standards for Education 2005 require that students with disability can
            participate in education{" "}
            <em className="text-foreground">on the same basis</em> as students without disability.
            Not the same activity. Not lowered expectations. The same opportunity to learn, take
            part and be assessed. That principle is the whole product.
          </p>
        </section>

        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <BookOpen size={20} className="text-primary" aria-hidden="true" />
            The four NCCD pillars
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {pillars.map((p) => (
              <div key={p.name} className="rounded-lg bg-muted/60 p-4">
                <dt className="font-semibold text-foreground">{p.name}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{p.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Sparkles size={20} className="text-primary" aria-hidden="true" />
            How a suggestion is made
          </h2>
          <ol className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            {[
              "You choose the class, the curriculum topic and, if you like, the specific activity.",
              "For each selected student, the student's functional profile, cultural and language background, trauma flags, triggers, calming strategies, strengths and goals are combined with the content you are teaching.",
              "A moment-specific adjustment is drafted, along with who else in the room benefits, cultural and trauma considerations, and a one-line rationale.",
              "You implement, modify, save or decline. Only implemented adjustments become evidence.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <ShieldCheck size={20} className="text-primary" aria-hidden="true" />
            Privacy and professional judgment
          </h2>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
            <li>This demo uses entirely synthetic students. No real student data is present.</li>
            <li>Nothing is implemented, logged or shared without an explicit teacher action.</li>
            <li>
              AI-generated content is marked with an{" "}
              <span className="font-medium text-foreground">AI-generated</span> badge everywhere it
              appears.
            </li>
            <li>Adjustments must be reviewed by a qualified teacher before classroom use.</li>
          </ul>
        </section>

        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <LifeBuoy size={20} className="text-primary" aria-hidden="true" />
            Common questions
          </h2>
          <dl className="mt-4 flex flex-col gap-4">
            {faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-medium text-foreground">{f.q}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
          <Link
            to="/planner"
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-light"
          >
            <Sparkles size={18} aria-hidden="true" />
            Try the Lesson Planner
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
