import type { SchoolData } from "./admin-types";

/** Builds the Ethical AI & Compliance Dossier as a plain-text Markdown report. */
export function buildDossier(data: SchoolData): string {
  const teachers = data.teachers.filter((t) => !t.isAdmin);
  const withEvidence = new Set(data.evidence.map((e) => e.studentId));
  const gens = data.activity.filter((a) => a.eventType === "generated" || a.eventType === "regenerated").length;
  const count = (t: string) => data.activity.filter((a) => a.eventType === t).length;
  const open = data.flags.filter((f) => f.status === "open");
  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "n/a");
  const lines = [
    `# Ethical AI & Compliance Dossier: ${data.school.name}`,
    `Generated ${new Date().toLocaleString("en-AU")}`,
    "",
    "## Legal and ethical basis",
    "- Disability Discrimination Act 1992 (Cth), 'on the same basis' principle",
    "- Disability Standards for Education 2005: consultation, reasonable adjustment, monitoring, review",
    "- Australia's AI Ethics Principles: human oversight, fairness, transparency, accountability",
    "",
    "## Embedded safeguards",
    "1. Human in the loop: no AI output becomes NCCD evidence without explicit teacher acceptance.",
    "2. Provenance: the original AI text is kept beside the teacher-edited version.",
    "3. Equity screening: every planner, crisis and family output is checked by rules and an AI reviewer.",
    "4. Append-only records: governance and AI audit logs reject edits and deletions at database level.",
    "5. Informed consent: teachers must give AI processing consent; changes are logged.",
    "6. Data minimisation: surnames are not sent to AI; demo data is synthetic.",
    "",
    "## Whole-school figures",
    `- Teachers: ${teachers.length}; students: ${data.students.length}`,
    `- Evidence completeness: ${pct(withEvidence.size, data.students.length)} (${data.evidence.length} entries)`,
    `- AI generations: ${gens}; accepted: ${count("accepted")}; edited: ${count("edited")}; declined: ${count("declined")}`,
    `- Acceptance rate: ${pct(count("accepted"), gens)}`,
    `- Equity flags: ${data.flags.length} total, ${open.length} open, ${data.flags.length - open.length} resolved`,
    `- Governance events recorded: ${data.governance.length}`,
    "",
    "## AI consent register",
    ...teachers.map((t) => `- ${t.fullName}: ${t.aiConsent ? `consent given ${t.aiConsentAt ? new Date(t.aiConsentAt).toLocaleString("en-AU") : ""}` : "NO CONSENT"}`),
    "",
    "## Equity flags",
    ...(data.flags.length
      ? data.flags.map((f) => `- [${f.status}] ${f.category} (${f.severity}): "${f.phrase}" (${f.reason})${f.resolutionNote ? `. Resolution: ${f.resolutionNote}` : ""}`)
      : ["- None recorded"]),
    "",
    "## Governance log (latest 100)",
    ...data.governance.slice(0, 100).map((g) => `- ${new Date(g.createdAt).toISOString()} | ${g.actorName || "-"} | ${g.category} | ${g.eventType} | ${g.summary}`),
    "",
  ];
  return lines.join("\n");
}
