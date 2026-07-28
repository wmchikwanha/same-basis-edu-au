import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAppState } from "@/lib/app-state";
import { StudentCard } from "@/components/StudentCard";
import { StudentDrawer } from "@/components/StudentDrawer";
import type { Student } from "@/lib/demo-data";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Student Profiles — SameBasis" },
      {
        name: "description",
        content:
          "Every student profile in one place: NCCD category and level, cultural and linguistic background, triggers, calming strategies and strengths.",
      },
      { property: "og:title", content: "Student Profiles — SameBasis" },
      {
        property: "og:description",
        content:
          "Every student profile in one place: NCCD category and level, cultural and linguistic background, triggers, calming strategies and strengths.",
      },
    ],
  }),
  component: StudentProfiles,
});

const filters = ["All", "Cognitive", "Social-Emotional", "Physical", "Sensory"] as const;

function StudentProfiles() {
  const { students } = useAppState();
  const [selected, setSelected] = useState<Student | null>(null);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const visible =
    filter === "All" ? students : students.filter((s) => s.profile.nccdCategory === filter);

  return (
    <AppShell
      title="Student Profiles"
      description="Profiles are teacher-facing summaries of disclosed information. They are not clinical records."
    >
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by NCCD category">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`min-h-[44px] rounded-lg px-4 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground shadow-warm-sm hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((s) => (
          <StudentCard key={s.id} student={s} onClick={setSelected} />
        ))}
      </div>
      {visible.length === 0 && (
        <p className="text-sm text-muted-foreground">No students in this category.</p>
      )}
      <StudentDrawer student={selected} onClose={() => setSelected(null)} />
    </AppShell>
  );
}
