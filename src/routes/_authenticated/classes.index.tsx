import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAppState } from "@/lib/app-state";
import { NccdLevelBadge } from "@/components/Badges";

export const Route = createFileRoute("/_authenticated/classes/")({
  head: () => ({
    meta: [
      { title: "My Classes — SameBasis" },
      {
        name: "description",
        content:
          "Every class you teach, with the number of students carrying an active NCCD adjustment profile.",
      },
      { property: "og:title", content: "My Classes — SameBasis" },
      {
        property: "og:description",
        content:
          "Every class you teach, with the number of students carrying an active NCCD adjustment profile.",
      },
    ],
  }),
  component: Classes,
});

function Classes() {
  const { classes, students } = useAppState();

  return (
    <AppShell
      title="My Classes"
      description="Open a class to see the roster and generate adjustments for the lesson you are about to teach."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {classes.map((c) => {
          const roster = students.filter((s) => s.classId === c.id);
          return (
            <Link
              key={c.id}
              to="/classes/$classId"
              params={{ classId: c.id }}
              className="group flex flex-col gap-4 rounded-xl bg-card p-6 shadow-warm-sm transition-shadow hover:shadow-warm-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground group-hover:text-primary">
                    {c.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Year {c.yearLevel} · {c.subject} · {roster.length} students
                  </p>
                </div>
                <ArrowRight
                  size={20}
                  className="mt-1 shrink-0 text-muted-foreground group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {roster.map((s) => (
                  <NccdLevelBadge key={s.id} level={s.profile.nccdLevel} />
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
