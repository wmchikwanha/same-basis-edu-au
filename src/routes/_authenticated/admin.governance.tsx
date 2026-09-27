import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Download, Lock, ScrollText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { logAdminExport } from "@/lib/admin.functions";
import { card, inputCls, primaryBtn, secondaryBtn, useSchool } from "@/lib/use-school";
import { downloadCsv, toCsv } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/admin/governance")({
  head: () => ({
    meta: [
      { title: "Governance Log | SameBasis Admin" },
      { name: "description", content: "Append-only, school-wide record of AI use, admin actions, consent and equity reviews." },
      { property: "og:title", content: "Governance Log | SameBasis Admin" },
      { property: "og:description", content: "Append-only, school-wide record of AI use, admin actions, consent and equity reviews." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GovernancePage,
});

const CATEGORIES = ["ai", "admin", "consent", "equity", "data"];

function GovernancePage() {
  const { data, reload } = useSchool();
  const logExport = useServerFn(logAdminExport);
  const [f, setF] = useState({ q: "", category: "all", actor: "all", from: "", to: "" });

  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const from = f.from ? new Date(`${f.from}T00:00:00`).getTime() : null;
    const to = f.to ? new Date(`${f.to}T23:59:59.999`).getTime() : null;
    return (data?.governance ?? []).filter((g) => {
      const t = new Date(g.createdAt).getTime();
      return (f.category === "all" || g.category === f.category) &&
        (f.actor === "all" || g.actorId === f.actor) &&
        (from === null || t >= from) && (to === null || t <= to) &&
        (!q || `${g.summary} ${g.eventType} ${g.actorName}`.toLowerCase().includes(q));
    });
  }, [data, f]);

  function exportCsv() {
    downloadCsv(
      `samebasis-governance-log-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(["Timestamp", "Actor", "Category", "Event", "Target type", "Target id", "Summary", "Record id"],
        rows.map((g) => [new Date(g.createdAt).toISOString(), g.actorName, g.category, g.eventType, g.targetType, g.targetId, g.summary, g.id])),
    );
    void logExport({ data: { summary: `Exported ${rows.length} governance log entries.` } }).then(() => reload());
  }

  const teachers = data?.teachers ?? [];

  return (
    <AppShell title="Governance log" description="Every AI, admin, consent, data and equity action across the school — in one append-only record.">
      <div className="flex flex-col gap-6">
        <section className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
          <Lock size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <p>This log is <strong>append-only</strong>. The database rejects any edit or deletion, including by administrators, so the record stands as audit evidence. Exporting the log is itself logged.</p>
        </section>

        <section className={card}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input placeholder="Search" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} className={inputCls} aria-label="Search log" />
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={`${inputCls} capitalize`} aria-label="Category"><option value="all">All categories</option>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <select value={f.actor} onChange={(e) => setF({ ...f, actor: e.target.value })} className={inputCls} aria-label="Person"><option value="all">Everyone</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}</select>
            <input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} className={inputCls} aria-label="From date" />
            <input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} className={inputCls} aria-label="To date" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">Showing {rows.length} of {data?.governance.length ?? 0} entries.</p>
            <button type="button" className={secondaryBtn} onClick={() => setF({ q: "", category: "all", actor: "all", from: "", to: "" })}>Clear filters</button>
            <button type="button" className={primaryBtn} onClick={exportCsv} disabled={!rows.length}><Download size={16} aria-hidden="true" /> Export CSV</button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Governance log</caption>
              <thead className="text-xs uppercase tracking-[0.08em] text-muted-foreground"><tr><th className="py-2">When</th><th>Who</th><th>Category</th><th>Event</th><th>Detail</th></tr></thead>
              <tbody>
                {rows.slice(0, 200).map((g) => (
                  <tr key={g.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap py-2 text-muted-foreground">{new Date(g.createdAt).toLocaleString("en-AU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="font-medium text-foreground">{g.actorName || "—"}</td>
                    <td className="capitalize text-muted-foreground">{g.category}</td>
                    <td className="text-muted-foreground">{g.eventType.replace(/_/g, " ")}</td>
                    <td className="py-2 text-muted-foreground">{g.summary}</td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No entries match.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className={card}>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><ScrollText size={20} className="text-primary" aria-hidden="true" /> AI consent register</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {teachers.map((t) => (
              <li key={t.id} className="flex justify-between py-2">
                <span className="font-medium text-foreground">{t.fullName}</span>
                <span className={t.aiConsent ? "text-muted-foreground" : "text-warning"}>{t.aiConsent ? `Consent given ${t.aiConsentAt ? new Date(t.aiConsentAt).toLocaleString("en-AU") : ""}` : "No consent — AI tools should not be used"}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
