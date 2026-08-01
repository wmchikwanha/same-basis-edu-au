import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Upload, Download, Loader2, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAppState } from "@/lib/app-state";
import { importWorkspaceData } from "@/lib/import.functions";
import { downloadCsv, parseCsvObjects, toCsv } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/import")({
  head: () => ({
    meta: [
      { title: "Import Your Trial Data — Classes, Students, Evidence | SameBasis" },
      {
        name: "description",
        content:
          "Load your own classes, student profiles and prior evidence entries from CSV so the planner and evidence pack reflect your real trial cohort.",
      },
      {
        property: "og:title",
        content: "Import Your Trial Data — Classes, Students, Evidence | SameBasis",
      },
      {
        property: "og:description",
        content:
          "Upload CSV files for classes, students and evidence to replace the seeded demo workspace with your own trial data.",
      },
    ],
  }),
  component: ImportPage,
});

type Kind = "classes" | "students" | "evidence";

const TEMPLATES: Record<Kind, { headers: string[]; example: (string | number)[] }> = {
  classes: {
    headers: ["name", "yearLevel", "subject"],
    example: ["Year 9 Science A", 9, "Science"],
  },
  students: {
    headers: [
      "className",
      "firstName",
      "lastName",
      "preferredName",
      "nccdCategory",
      "nccdLevel",
      "primaryDiagnosis",
      "functionalDescription",
      "culturalBackground",
      "languagesSpoken",
      "ealdLevel",
      "traumaFlags",
      "knownTriggers",
      "calmingStrategies",
      "familyCommunicationPref",
      "strengths",
      "iepGoals",
    ],
    example: [
      "Year 9 Science A",
      "Sample",
      "Student",
      "Sam",
      "Cognitive",
      "Supplementary",
      "",
      "Loses track of multi-step instructions and needs them chunked.",
      "",
      "English",
      "",
      "",
      "",
      "",
      "Email preferred",
      "Strong practical problem solver",
      "Complete 3-step tasks with a written checklist",
    ],
  },
  evidence: {
    headers: ["studentName", "logDate", "pillar", "evidenceSummary", "source"],
    example: [
      "Sam",
      "2026-07-20",
      "Adjustment",
      "Provided a written checklist for the practical.",
      "teacher-recorded",
    ],
  },
};

const HINTS: Record<Kind, string> = {
  classes: "Columns: name, yearLevel, subject. Import classes first.",
  students:
    "className must match a class you already have (or one imported above). Only className, firstName and lastName are required.",
  evidence:
    "studentName matches a student's preferred or first name. Dates as YYYY-MM-DD. Pillar is Consultation, Adjustment, Monitoring or Review.",
};

function coerce(kind: Kind, rows: Record<string, string>[]) {
  const pick = (row: Record<string, string>, key: string) =>
    row[key.toLowerCase().replace(/[^a-z0-9]/g, "")] ?? "";

  if (kind === "classes") {
    return rows
      .filter((r) => pick(r, "name"))
      .map((r) => ({
        name: pick(r, "name"),
        yearLevel: Number(pick(r, "yearLevel")) || 8,
        subject: pick(r, "subject") || "General",
      }));
  }
  if (kind === "students") {
    return rows
      .filter((r) => pick(r, "firstName"))
      .map((r) => {
        const out: Record<string, string> = {};
        for (const header of TEMPLATES.students.headers) out[header] = pick(r, header);
        return out;
      });
  }
  return rows
    .filter((r) => pick(r, "studentName") && pick(r, "evidenceSummary"))
    .map((r) => ({
      studentName: pick(r, "studentName"),
      logDate: pick(r, "logDate") || new Date().toISOString().slice(0, 10),
      pillar: pick(r, "pillar") || "Adjustment",
      evidenceSummary: pick(r, "evidenceSummary"),
      source: pick(r, "source") || "teacher-recorded",
    }));
}

function ImportPage() {
  const { refresh } = useAppState();
  const runImport = useServerFn(importWorkspaceData);
  const [staged, setStaged] = useState<Record<Kind, Record<string, unknown>[]>>({
    classes: [],
    students: [],
    evidence: [],
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    classesAdded: number;
    studentsAdded: number;
    evidenceAdded: number;
    errors: string[];
  } | null>(null);

  function onFile(kind: Kind, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = coerce(kind, parseCsvObjects(String(reader.result ?? "")));
        setStaged((prev) => ({ ...prev, [kind]: rows }));
        toast.success(`${rows.length} ${kind} rows read from ${file.name}`);
      } catch {
        toast.error(`We couldn't read ${file.name}. Check it is a plain CSV file.`);
      }
    };
    reader.readAsText(file);
  }

  const total = staged.classes.length + staged.students.length + staged.evidence.length;

  async function onImport() {
    setBusy(true);
    setResult(null);
    try {
      const res = await runImport({ data: staged });
      setResult(res);
      await refresh();
      toast.success("Import complete", {
        description: `${res.classesAdded} classes, ${res.studentsAdded} students, ${res.evidenceAdded} evidence entries added.`,
      });
      setStaged({ classes: [], students: [], evidence: [] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The import could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Import your trial data"
      description="Load your own classes, students and prior evidence from CSV instead of the seeded demo workspace."
    >
      <div className="flex max-w-3xl flex-col gap-6">
        <p className="flex items-start gap-2 rounded-xl bg-warning-soft p-4 text-sm text-warning">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          Import de-identified data only during the trial — use initials or pseudonyms rather than
          real student names, and never upload medical records.
        </p>

        {(Object.keys(TEMPLATES) as Kind[]).map((kind) => (
          <section key={kind} className="rounded-xl bg-card p-6 shadow-warm-sm">
            <h2 className="text-lg font-semibold capitalize text-foreground">{kind}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{HINTS[kind]}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted">
                <Upload size={16} aria-hidden="true" />
                Choose CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFile(kind, file);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    `samebasis-${kind}-template.csv`,
                    toCsv(TEMPLATES[kind].headers, [TEMPLATES[kind].example]),
                  )
                }
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Download size={16} aria-hidden="true" />
                Download template
              </button>
              <span className="text-sm text-muted-foreground">
                {staged[kind].length} row{staged[kind].length === 1 ? "" : "s"} ready
              </span>
            </div>
          </section>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onImport}
            disabled={busy || total === 0}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-60"
          >
            {busy ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Upload size={18} aria-hidden="true" />
            )}
            {busy ? "Importing…" : `Import ${total} row${total === 1 ? "" : "s"}`}
          </button>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info size={14} aria-hidden="true" />
            Imports add to your workspace — nothing existing is deleted.
          </span>
        </div>

        {result && (
          <section className="rounded-xl bg-card p-6 shadow-warm-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <CheckCircle2 size={20} className="text-primary" aria-hidden="true" />
              Import summary
            </h2>
            <p className="mt-2 text-sm text-foreground">
              {result.classesAdded} classes, {result.studentsAdded} students and{" "}
              {result.evidenceAdded} evidence entries were added.
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-warning">
                {result.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
