import { useCallback, useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { useAppState } from "@/lib/app-state";

const TOUR_EVENT = "samebasis:start-tour";
const storageKey = (id: string) => `samebasis.tour.v1.${id}`;

export function startGuidedTour() {
  window.dispatchEvent(new CustomEvent(TOUR_EVENT));
}

type Step = {
  selector: string;
  title: string;
  body: string;
};

const steps: Step[] = [
  {
    selector: '[data-tour="nav-/planner"]',
    title: "1. Plan a lesson",
    body: "Pick a class and topic, and SameBasis drafts a specific reasonable adjustment for every student at once. You approve, edit or decline each one.",
  },
  {
    selector: '[data-tour="nav-/evidence"]',
    title: "2. Evidence builds itself",
    body: "Anything you implement is logged against the right NCCD pillar, with week-by-week coverage and a CSV export for census.",
  },
  {
    selector: '[data-tour="nav-/family"]',
    title: "3. Family messages",
    body: "Turn the same adjustment into a strengths-first message home, in plain English, mindful of language and culture — logged as Consultation evidence.",
  },
];

/** Automated browsers (Playwright, Puppeteer, Selenium) never see the tour. */
function isAutomated(): boolean {
  return typeof navigator !== "undefined" && navigator.webdriver === true;
}

export function GuidedTour() {
  const { profile, hydrated } = useAppState();
  const [index, setIndex] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const markSeen = useCallback(() => {
    if (profile) localStorage.setItem(storageKey(profile.id), "done");
  }, [profile]);

  const finish = useCallback(() => {
    markSeen();
    setIndex(null);
  }, [markSeen]);

  useEffect(() => {
    const handler = () => setIndex(0);
    window.addEventListener(TOUR_EVENT, handler);
    return () => window.removeEventListener(TOUR_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!hydrated || !profile || index !== null) return;
    if (isAutomated()) return;
    if (localStorage.getItem(storageKey(profile.id))) return;
    const t = setTimeout(() => setIndex(0), 600);
    return () => clearTimeout(t);
  }, [hydrated, profile, index]);

  // As soon as the tour is shown once, record it as seen so it can never
  // reappear for this teacher — even if they navigate away mid-tour.
  useEffect(() => {
    if (index !== null) markSeen();
  }, [index, markSeen]);

  // Any click or keypress anywhere outside the tour card dismisses it. The
  // overlay itself is pointer-events-none, so that click still reaches the
  // underlying UI and nothing is ever blocked.
  useEffect(() => {
    if (index === null) return;
    const dismiss = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-tour-card]")) return;
      finish();
    };
    document.addEventListener("pointerdown", dismiss, true);
    document.addEventListener("keydown", dismiss, true);
    return () => {
      document.removeEventListener("pointerdown", dismiss, true);
      document.removeEventListener("keydown", dismiss, true);
    };
  }, [index, finish]);

  useEffect(() => {
    if (index === null) return;
    const measure = () => {
      const el = document.querySelector(steps[index].selector);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [index]);

  if (index === null) return null;
  const step = steps[index];
  const last = index === steps.length - 1;

  const cardStyle: React.CSSProperties = rect
    ? {
        top: Math.min(Math.max(rect.top - 8, 16), window.innerHeight - 260),
        left: Math.min(rect.right + 16, window.innerWidth - 340),
      }
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="false"
      aria-label="Guided tour"
    >
      {rect && (
        <div
          className="pointer-events-none absolute rounded-lg ring-4 ring-accent"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
          }}
        />
      )}

      <div
        data-tour-card
        className="pointer-events-auto absolute w-[320px] max-w-[90vw] rounded-xl bg-card p-5 shadow-warm-lg"
        style={cardStyle}
      >
        <button
          onClick={finish}
          aria-label="Skip tour"
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <X size={16} aria-hidden="true" />
        </button>
        <p className="section-label">
          Quick tour · {index + 1} of {steps.length}
        </p>
        <h2 className="mt-1 text-base font-semibold text-foreground">{step.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => (last ? finish() : setIndex(index + 1))}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-light"
          >
            {last ? "Start using SameBasis" : "Next"}
            {!last && <ArrowRight size={16} aria-hidden="true" />}
          </button>
          <button
            onClick={finish}
            className="min-h-[40px] rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
