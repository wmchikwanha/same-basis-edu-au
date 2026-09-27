import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Upload, UserPlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { addStudentForSchool, importSchoolStudents, moveStudent } from "@/lib/admin.functions";
import { card, inputCls, primaryBtn, secondaryBtn, useSchool } from "@/lib/use-school";
import { downloadCsv, normaliseHeader, parseCsvObjects, toCsv } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/admin/students")({
  head: () => ({
    meta: [
      { title: "Whole-school Students | SameBasis Admin" },
      { name: "description", content: "Every student across the school: add, assign, move and bulk-import." },
      { property: "og:title", content: "Whole-school Students | SameBasis Admin" },
      { property: "og:description", content: "Every student across the school: add, assign, move and bulk-import." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentsPage,
});

const CATS = ["Cognitive", "Social-Emotional", "Physical", "Sensory"] as const;
const LEVELS = ["QDTP", "Supplementary", "Substantial", "Extensive"] as const;
const TEMPLATE = ["teacher_email", "class_name", "first_name", "last_name", "preferred_name", "nccd_category", "nccd_level", "functional_description", "cultural_background", "eald_level", "strengths"];

function StudentsPage() {
  const { data, reload } = useSchool();
  const add = useServerFn(addStudentForSchool);
  const move = useServerFn(moveStudent);
  const importFn = useServerFn(importSchoolStudents);
  const [filters, setFilters] = useState({ teacher: "all", cat: "all", level: "all", q: "" });
  const [form, setForm] = useState({ classId: "", firstName: "", lastName: "", nccdCategory: "Cognitive" as (typeof CATS)[number], nccdLevel: "QDTP" as (typeof LEVELS)[number], functionalDescription: "" });
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const teacherName = (id: string) => data?.teachers.find((t) => t.id === id)?.fullName ?? "—";
  const className = (id: string) => data?.classes.find((c) => c.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return (data?.students ?? []).filter((s) =>
      (filters.teacher === "all" || s.teacherId === filters.teacher) &&
      (filters.cat === "all" || s.profile.nccdCategory === filters.cat) &&
      (filters.level === "all" || s.profile.nccdLevel === filters.level) &&
      (!q || `${s.preferredName} ${s.firstName} ${s.lastName}`.toLowerCase().includes(q)),
    );
  }, [data, filters]);

  async function onFile(file: File) {
    const objs = parseCsvObjects(await file.text());
    const parsed = objs.map((o) => {
      const r: Record<string, string> = {};
      for (const [k, v] of Object.entries(o)) r[normaliseHeader(k)] = v.trim();
      return {
        teacherEmail: r.teacher_email ?? "",
        className: r.class_name ?? "",
        firstName: r.first_name ?? "",
        lastName: r.last_name ?? "",
        preferredName: r.preferred_name || undefined,
        nccdCategory: (CATS.find((c) => c.toLowerCase() === (r.nccd_category ?? "").toLowerCase()) ?? "Cognitive"),
        nccdLevel: (LEVELS.find((c) => c.toLowerCase() === (r.nccd_level ?? "").toLowerCase()) ?? "QDTP"),
        functionalDescription: r.functional_description ?? "",
        culturalBackground: r.cultural_background || undefined,
        ealdLevel: r.eald_level || undefined,
        strengths: r.strengths || undefined,
      };
    });
    const bad = parsed.map((p, i) => (!p.teacherEmail || !p.className || !p.firstName || !p.lastName ? `Row ${i + 2}: teacher_email, class_name, first_name and last_name are required.` : null)).filter(Boolean) as string[];
    const good = parsed.filter((p) => p.teacherEmail && p.className && p.firstName && p.lastName);
    try {
      const res = good.length ? await importFn({ data: { rows: good } }) : { added: 0, errors: [] };
      setImportErrors([...bad, ...res.errors]);
      toast.success(`${res.added} student(s) imported${bad.length + res.errors.length ? `, ${bad.length + res.errors.length} rejected` : ""}.`);
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed — check the file matches the template.");
    }
  }

  return (
    <AppShell title="Whole-school students" description="Every student across every teacher. Add, assign or move students, or bulk-import for the whole school.">
      <div className="flex flex-col gap-6">
        <section className={card}>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><UserPlus size={20} className="text-primary" aria-hidden="true" /> Add a student to any class</h2>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
            onSubmit={(e) => {
              e.preventDefault();
              void add({ data: form })
                .then(() => { toast.success("Student added"); setForm({ ...form, firstName: "", lastName: "", functionalDescription: "" }); return reload(); })
                .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Couldn't add student"));
            }}
          >
            <select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className={inputCls} aria-label="Class">
              <option value="">Choose class…</option>
              {data?.classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {teacherName(c.teacherId)}</option>)}
            </select>
            <input required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputCls} aria-label="First name" />
            <input required placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputCls} aria-label="Last name" />
            <select value={form.nccdCategory} onChange={(e) => setForm({ ...form, nccdCategory: e.target.value as (typeof CATS)[number] })} className={inputCls} aria-label="NCCD category">{CATS.map((c) => <option key={c}>{c}</option>)}</select>
            <select value={form.nccdLevel} onChange={(e) => setForm({ ...form, nccdLevel: e.target.value as (typeof LEVELS)[number] })} className={inputCls} aria-label="NCCD level">{LEVELS.map((c) => <option key={c}>{c}</option>)}</select>
            <button type="submit" className={primaryBtn}>Add student</button>
            <input placeholder="Functional impact (what support is needed, not a label)" value={form.functionalDescription} onChange={(e) => setForm({ ...form, functionalDescription: e.target.value })} className={`${inputCls} sm:col-span-2 lg:col-span-6`} aria-label="Functional description" />
          </form>
        </section>

        <section className={card}>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><Upload size={20} className="text-primary" aria-hidden="true" /> Whole-school CSV import</h2>
          <p className="mt-1 text-sm text-muted-foreground">Each row names the teacher (by email) and their class. Rows that fail are listed below with the reason.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={secondaryBtn} onClick={() => downloadCsv("samebasis-school-students-template.csv", toCsv(TEMPLATE, [[data?.teachers.find((t) => !t.isAdmin)?.email ?? "teacher@school.edu.au", data?.classes[0]?.name ?? "Year 8 Science B", "Alex", "Citizen", "Alex", "Cognitive", "Supplementary", "Benefits from chunked instructions", "", "", "Visual thinker"]]))}><Download size={16} aria-hidden="true" /> Download template</button>
            <label className={`${primaryBtn} cursor-pointer`}>
              <Upload size={16} aria-hidden="true" /> Upload CSV
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ""; }} />
            </label>
          </div>
          {importErrors.length > 0 && (
            <ul className="mt-3 list-disc rounded-lg border border-destructive/40 bg-destructive/5 p-3 pl-7 text-sm text-destructive">
              {importErrors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
        </section>

        <section className={card}>
          <div className="grid gap-3 sm:grid-cols-4">
            <input placeholder="Search name" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} className={inputCls} aria-label="Search students" />
            <select value={filters.teacher} onChange={(e) => setFilters({ ...filters, teacher: e.target.value })} className={inputCls} aria-label="Teacher"><option value="all">All teachers</option>{data?.teachers.filter((t) => !t.isAdmin).map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}</select>
            <select value={filters.cat} onChange={(e) => setFilters({ ...filters, cat: e.target.value })} className={inputCls} aria-label="NCCD category"><option value="all">All categories</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
            <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })} className={inputCls} aria-label="NCCD level"><option value="all">All levels</option>{LEVELS.map((c) => <option key={c}>{c}</option>)}</select>
          </div>
          <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">Showing {rows.length} of {data?.students.length ?? 0} students.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.08em] text-muted-foreground"><tr><th className="py-2">Student</th><th>Teacher</th><th>Class</th><th>NCCD</th><th>Move to class</th></tr></thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="py-2 font-medium text-foreground">{s.preferredName} {s.lastName}</td>
                    <td className="text-muted-foreground">{teacherName(s.teacherId)}</td>
                    <td className="text-muted-foreground">{className(s.classId)}</td>
                    <td className="text-muted-foreground">{s.profile.nccdCategory} · {s.profile.nccdLevel}</td>
                    <td className="py-2">
                      <select
                        value={s.classId}
                        aria-label={`Move ${s.preferredName}`}
                        className={inputCls}
                        onChange={(e) =>
                          void move({ data: { studentId: s.id, classId: e.target.value } })
                            .then(() => { toast.success(`${s.preferredName} moved`); return reload(); })
                            .catch((err: unknown) => toast.error(err instanceof Error ? err.message : "Couldn't move student"))
                        }
                      >
                        {data?.classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {teacherName(c.teacherId)}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
