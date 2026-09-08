import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  ShieldCheck,
  Sparkles,
  Scale,
  LifeBuoy,
  HeartPulse,
  MessageCircle,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({
    meta: [
      { title: "Help & Info — How SameBasis Works" },
      {
        name: "description",
        content:
          "How SameBasis generates reasonable adjustments, crisis guidance and family messages, what the NCCD four pillars mean, and how teacher judgment, privacy and legal obligations are protected.",
      },
      { property: "og:title", content: "Help & Info — How SameBasis Works" },
      {
        property: "og:description",
        content:
          "How SameBasis generates reasonable adjustments, crisis guidance and family messages, what the NCCD four pillars mean, and how teacher judgment, privacy and legal obligations are protected.",
      },
    ],
  }),
  component: HelpPage,
});

const pillars = [
  {
    name: "Consultation",
    text: "Evidence that the school consulted the student, their family or specialists about the adjustments provided. Family messages you log land here.",
  },
  {
    name: "Adjustment",
    text: "Evidence that personalised adjustments were actually provided in class. Every adjustment you implement in the Lesson Planner lands here.",
  },
  {
    name: "Monitoring",
    text: "Evidence that the impact of the adjustment on participation and learning was observed over time. Crisis and regulation notes land here.",
  },
  {
    name: "Review",
    text: "Evidence that adjustments were reviewed and changed when they were no longer the right fit. Add these manually from the Evidence Log.",
  },
];

const levels = [
  { name: "QDTP", text: "Quality Differentiated Teaching Practice — adjustments within everyday good teaching." },
  { name: "Supplementary", text: "Adjustments at specific times, supplementary to the usual class programme." },
  { name: "Substantial", text: "Substantial, frequent adjustments and considerable adult support." },
  { name: "Extensive", text: "Extensive, highly individualised adjustments and intensive support." },
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
    q: "Is the crisis guidance a substitute for my school's plan?",
    a: "Never. It supports low-level de-escalation and reflection. Your school's behaviour support plan, risk management plan and emergency procedures always take precedence, and 000 is always the right call in an emergency.",
  },
  {
    q: "Can I send a family message straight from SameBasis?",
    a: "No, and that is deliberate. Messages are drafted for you to read, edit and send through your school's own channels, in your own voice.",
  },
  {
    q: "How does this help at NCCD census time?",
    a: "Implemented adjustments are timestamped and auto-tagged by pillar, so the evidence you need already exists as a by-product of teaching, rather than being reconstructed in the last fortnight.",
  },
];

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Scale;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-card p-6 shadow-warm-sm">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Icon size={20} className="text-primary" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function HelpPage() {
  return (
    <AppShell
      title="Help & Info"
      description="What SameBasis is, what it is not, and how the evidence fits together."
    >
      <div className="flex flex-col gap-6">
        <Card icon={Scale} title={'Why "SameBasis"'}>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The Disability Standards for Education 2005, made under the Disability Discrimination
            Act 1992, require that students with disability can participate in education{" "}
            <em className="text-foreground">on the same basis</em> as students without disability.
            Not the same activity. Not lowered expectations. The same opportunity to learn, take
            part and be assessed. That principle is the whole product.
          </p>
        </Card>

        <Card icon={BookOpen} title="The four NCCD pillars">
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {pillars.map((p) => (
              <div key={p.name} className="rounded-lg bg-muted/60 p-4">
                <dt className="font-semibold text-foreground">{p.name}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{p.text}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card icon={BookOpen} title="The four levels of adjustment">
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {levels.map((l) => (
              <div key={l.name} className="rounded-lg bg-muted/60 p-4">
                <dt className="font-semibold text-foreground">{l.name}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{l.text}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card icon={Sparkles} title="How a suggestion is made">
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
        </Card>

        <Card icon={HeartPulse} title="Using the crisis guidance well">
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
            <li>
              It is written for low-level dysregulation, withdrawal and escalation — the moments
              before anything becomes an incident.
            </li>
            <li>
              It always includes what <span className="font-medium text-foreground">not</span> to
              do, because the guardrails matter as much as the steps.
            </li>
            <li>
              It never suggests restraint, seclusion or any restrictive practice, and it never
              suggests public discipline.
            </li>
            <li>
              Your school's behaviour support plan, risk plan and emergency procedures always take
              precedence. In an emergency, call 000.
            </li>
          </ul>
        </Card>

        <Card icon={MessageCircle} title="Talking with families">
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
            <li>Messages open with a genuine strength, never a deficit.</li>
            <li>No jargon, no acronyms, no diagnosis, no speculation.</li>
            <li>
              Language and cultural considerations are flagged, including when an interpreter should
              be offered.
            </li>
            <li>
              Nothing is sent from SameBasis. You copy, edit and send through your school's own
              channels.
            </li>
          </ul>
        </Card>

        <Card icon={ClipboardCheck} title="Building the evidence pack">
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
            <li>Implemented adjustments log automatically against the Adjustment pillar.</li>
            <li>Crisis notes log against Monitoring; family messages log against Consultation.</li>
            <li>Review notes and offline meetings can be added manually at any time.</li>
            <li>
              Filter by pillar or student, then export to CSV or print to PDF for your learning
              support team.
            </li>
          </ul>
        </Card>

        <Card icon={ShieldCheck} title="Privacy and professional judgment">
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
            <li>This demo uses entirely synthetic students. No real student data is present.</li>
            <li>Nothing is implemented, logged or shared without an explicit teacher action.</li>
            <li>Demo records stay in your own browser and are never uploaded anywhere.</li>
            <li>
              AI-generated content is marked with an{" "}
              <span className="font-medium text-foreground">AI-generated</span> badge everywhere it
              appears.
            </li>
            <li>Adjustments must be reviewed by a qualified teacher before classroom use.</li>
          </ul>
        </Card>

        <Card icon={AlertTriangle} title="Limitations and disclaimer">
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            SameBasis is a decision <em>support</em> tool. It is not legal advice, medical advice,
            psychological advice or a compliance guarantee. AI-generated text can be wrong,
            incomplete or subtly inappropriate for a particular student, and it cannot see your
            classroom. Responsibility for what is provided to a student, and for what is recorded as
            NCCD evidence, rests with the teacher and the school. Always check outputs against your
            school's policies, the student's plan, and your own professional knowledge of the child.
          </p>
        </Card>

        <Card icon={LifeBuoy} title="Common questions">
          <dl className="mt-4 flex flex-col gap-4">
            {faqs.map((f) => (
              <div key={f.q}>
                <dt className="font-medium text-foreground">{f.q}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/planner"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-light"
            >
              <Sparkles size={18} aria-hidden="true" />
              Try the Lesson Planner
            </Link>
            <Link
              to="/crisis"
              search={{ student: undefined }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <HeartPulse size={18} aria-hidden="true" />
              Crisis guidance
            </Link>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
