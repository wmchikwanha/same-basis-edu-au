# Whole-school Admin Panel with Governance, Ethics and Equity Logging

## Goal
Turn the School Admin view into a proper head-of-school console: oversee every teacher, create teacher accounts, manage students across the whole school, and audit AI use with tamper-resistant governance and zero-discrimination logging. It will have more tools than the teacher view, not fewer.

## What the admin will see (new admin navigation)

1. **School overview**: whole-school stats across all teachers: classes, students, adjustments, evidence completeness by teacher and by NCCD pillar, AI generations, acceptance rates, and a list of open equity flags.
2. **Teachers**: a list of every teacher at the school with their classes, student count, evidence completeness and last activity.
   - **Create teacher account** form (name, email, temporary password, year level). The new teacher can sign in straight away.
   - Deactivate or reactivate a teacher (their data is kept).
   - "View as oversight": read-only view of that teacher's classes, adjustments and evidence.
3. **Students (whole school)**: every student in the school, with filters by teacher, class, NCCD category and level. Admin can add a student, assign or move them to any teacher's class, and bulk-import for the whole school with CSV (the existing import screen, extended with a "teacher email" column).
4. **Classes**: all classes, with admin able to create a class for any teacher.
5. **Governance log (append-only)**: every admin and AI action at school level, including account created, student moved, AI output generated/edited/accepted/declined, exports and consent changes. The log cannot be edited or cleared by anyone, admin included. Filters, search and CSV export are the same as the current audit trail.
6. **Ethics and equity monitor (zero-discrimination)**:
   - Every AI output is automatically screened before a teacher sees it. The screen looks for deficit or stigmatising language, lowered expectations (for example "exclude from", "simplify the outcome", "separate room"), cultural stereotyping, and adjustments that change the curriculum outcome instead of access. Anything flagged is logged with the phrase and reason, and the teacher sees a warning on that output.
   - **Equity dashboard**: compares adjustment volume, acceptance and decline rates, and evidence coverage across NCCD categories, CALD/EAL-D and trauma-informed groups, so the head can spot any group being under-served or treated differently.
   - The admin can review each flag and resolve it with a note (for example "reviewed, appropriate" or "teacher followed up"). Resolutions go into the governance log.
7. **Consent register**: which teachers have given or withdrawn AI consent, and when.

## Sandbox behaviour
"Enter as School Admin" creates a private sandbox school containing the admin plus three synthetic teachers, each with a seeded class of students, adjustments, evidence and a few AI events (including one equity flag to demonstrate review). The admin panel is full from the first click. "Enter as Teacher" works as it does now. The two sandboxes stay isolated from each other.

## Technical details
- New tables (with GRANTs and RLS): `schools`, `school_members` (user_id, school_id, active), `user_roles` (separate table, `app_role` enum: admin/teacher), `governance_events` (append-only: INSERT and SELECT policies only, no UPDATE/DELETE; revoke update/delete), `equity_flags` (output id, category, phrase, severity, status, resolution note, resolved_by).
- `has_role()` and `is_school_admin_of(user_id)` security-definer functions. Existing tables get extra SELECT/UPDATE policies so a school admin can read and manage rows owned by teachers in their school. The existing owner policies stay unchanged.
- Admin server functions in `src/lib/admin.functions.ts`, using `requireSupabaseAuth` and a `has_role` check through the user client. Teacher account creation uses the service-role client, loaded inside the handler only after the admin check passes, and writes to the governance log.
- Equity screen: `src/lib/equity.server.ts`. It runs a deterministic rule-based lexicon plus a structured AI check (Lovable AI) on every planner, crisis and family output, and records flags server-side.
- Admin role comes from the database, not localStorage. Admin routes are placed under an admin gate that checks the role on the server.
- New routes: `/admin` (overview), `/admin/teachers`, `/admin/teachers/$teacherId`, `/admin/students`, `/admin/governance`, `/admin/equity`. AppShell shows admin navigation only to users who hold the admin role.
- The technical and audit documentation will be updated with the new controls.
