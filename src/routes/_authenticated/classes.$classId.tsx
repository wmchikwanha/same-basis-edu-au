import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAppState } from "@/lib/app-state";
import { StudentCard } from "@/components/StudentCard";
import { StudentDrawer } from "@/components/StudentDrawer";
import type { Student } from "@/lib/demo-data";

export const Route = createFileRoute("/classes/$classId")({
  head: () => ({
    meta: [
      { title: "Class Roster — SameBasis" },
      {
        name: "description",
        content:
          "Class roster with NCCD level, cultural background and trauma-informed context for every student.",
      },
      { property: "og:title", content: "Class Roster — SameBasis" },
      {
        property: "og:description",
        content:
          "Class roster with NCCD level, cultural background and trauma-informed context for every student.",
      },
    ],
  }),
  component: ClassRoster,
});

function ClassRoster() {
  const { classId } = Route.useParams();
  const { classes, students } = useAppState();
  const [selected, setSelected] = useState<Student | null>(null);

  const klass = classes.find((c) => c.id === classId);
  if (!klass) throw notFound();
  const roster = students.filter((s) => s.classId === klass.id);

  return (
    <AppShell
      title={klass.name}
      description={`Year ${klass.yearLevel} ${klass.subject} · ${roster.length} students. Select a student to open their full profile.`}
      action={
        <Link
          to="/planner"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-warm-sm transition-colors hover:bg-primary-light"
        >
          <Sparkles size={18} aria-hidden="true" />
          Generate adjustments for this lesson
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {roster.map((s) => (
          <StudentCard key={s.id} student={s} onClick={setSelected} />
        ))}
      </div>
      <StudentDrawer student={selected} onClose={() => setSelected(null)} />
    </AppShell>
  );
}
