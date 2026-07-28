import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, User, School, Info } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAppState } from "@/lib/app-state";
import { demoUser } from "@/lib/brand";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SameBasis Demo" },
      {
        name: "description",
        content:
          "Demo account details, school context and the option to reset all locally saved adjustments and evidence.",
      },
      { property: "og:title", content: "Settings — SameBasis Demo" },
      {
        property: "og:description",
        content:
          "Demo account details, school context and the option to reset all locally saved adjustments and evidence.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { adjustments, evidenceLogs, resetDemo } = useAppState();

  return (
    <AppShell title="Settings" description="Demo account and workspace preferences.">
      <div className="flex max-w-2xl flex-col gap-6">
        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <User size={20} className="text-primary" aria-hidden="true" />
            Account
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="section-label">Name</dt>
              <dd className="mt-1 text-foreground">{demoUser.fullName}</dd>
            </div>
            <div>
              <dt className="section-label">Role</dt>
              <dd className="mt-1 text-foreground">{demoUser.role}</dd>
            </div>
            <div>
              <dt className="section-label">Email</dt>
              <dd className="mt-1 text-foreground">{demoUser.email}</dd>
            </div>
            <div>
              <dt className="section-label">Mode</dt>
              <dd className="mt-1 text-foreground">Demo (synthetic data)</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <School size={20} className="text-primary" aria-hidden="true" />
            School context
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="section-label">School</dt>
              <dd className="mt-1 text-foreground">{demoUser.school}</dd>
            </div>
            <div>
              <dt className="section-label">Jurisdiction</dt>
              <dd className="mt-1 text-foreground">New South Wales</dd>
            </div>
            <div>
              <dt className="section-label">Curriculum</dt>
              <dd className="mt-1 text-foreground">Australian Curriculum v9</dd>
            </div>
            <div>
              <dt className="section-label">Language</dt>
              <dd className="mt-1 text-foreground">Australian English</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl bg-card p-6 shadow-warm-sm">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <RotateCcw size={20} className="text-primary" aria-hidden="true" />
            Reset demo data
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You currently have {adjustments.length}{" "}
            {adjustments.length === 1 ? "adjustment" : "adjustments"} and {evidenceLogs.length}{" "}
            {evidenceLogs.length === 1 ? "evidence entry" : "evidence entries"} saved in this
            browser. Resetting clears them and returns the demo to its starting state.
          </p>
          <button
            onClick={() => {
              resetDemo();
              toast.success("Demo reset", {
                description: "All saved adjustments and evidence have been cleared.",
              });
            }}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-destructive/40 px-5 text-sm font-semibold text-destructive hover:bg-destructive/10"
          >
            <RotateCcw size={18} aria-hidden="true" />
            Reset demo data
          </button>
        </section>

        <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          Demo data is stored only in this browser. Nothing is uploaded, and all students are
          synthetic.
        </p>
      </div>
    </AppShell>
  );
}
