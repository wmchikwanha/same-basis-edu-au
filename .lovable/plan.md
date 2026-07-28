## SameBasis — Phase 1

A demo-mode-only build of SameBasis: no sign-in, every visitor lands directly in the pre-populated "Year 8 Science B" classroom with the six synthetic student profiles from your brief.

### What Phase 1 delivers

**Design system & shell**
- Full palette from your brief as semantic tokens: Deep Forest Teal `#2D6A4F`, Sage, Warm Amber, Soft Coral, Warm Cream canvas `#FEFAE0`, Dark Forest text, Mint/Terracotta states. Amber focus rings.
- Inter typography, `rounded-xl` cards, `rounded-lg` buttons, warm subtle shadows, generous `gap-6` spacing, 1.6 body line height, 44px minimum touch targets, WCAG AA contrast.
- Collapsible sidebar (Dashboard, My Classes, Student Profiles, Lesson Planner, Evidence Log, Help & Info, Settings), top bar with avatar/school/date/notifications, 1280px centred content, bottom tab bar on mobile.
- `SameBasis | Developed by Walter C | © 2026 All Rights Reserved` footer on every page. All branding pulled from a single config file so the product can be renamed in one place.

**Dashboard**
- Welcome card, quick stats (students, NCCD profiles, adjustments this week, evidence completeness %), today's classes, gentle 10-week NCCD reminders, recent activity feed.

**Class roster**
- Student cards with initials avatars, colour-coded NCCD level badges (QDTP grey / Supplementary blue / Substantial amber / Extensive terracotta), CALD indicator. Badges pair colour with text so colour is never the only signal.
- "Generate Adjustments for This Lesson" entry point.

**Student profile drawer** (slide-in from right; full-screen on mobile)
- Identity, Needs, Context (trauma flags, triggers, calming strategies, family communication), Strengths in green, IEP goals, action buttons.

**Lesson Planner / Adjustment Generator (the core)**
- Step 1 select class + curriculum topic (8 Year 8 Science topics pre-loaded) + optional activity description.
- Step 2 review/toggle students.
- Step 3 generate, with the warm per-student loading state ("Consulting the evidence base for Aisha…").
- Step 4 one card per student: the adjustment, UDL benefit, cultural note, trauma note, rationale, NCCD pillar/level tags, and Implement / Modify / Decline / Save actions. Every output editable before implementing — nothing auto-implements.
- Step 5 implementing writes an adjustment record plus an evidence log entry with timestamp and optional teacher reflection.

**AI**
- Lovable Cloud enabled so the AI Gateway (Gemini 2.5 Flash) can be called from a server function using your exact prompt structure, rules, and JSON output contract. The API key stays server-side.

### Technical notes
- Demo data (class, 6 students, curriculum topics) ships as seeded app data; generated adjustments and evidence logs persist in the browser for the session so the demo flow is repeatable and self-contained. No accounts, no per-user tables, nothing to sign up for — an evaluator opens the link and is immediately inside the app.
- The AI call runs through a TanStack server function; the JSON response is validated before rendering, with a graceful fallback if a field is missing.
- Routes: `/` (dashboard), `/classes`, `/classes/$classId`, `/students`, `/planner`, `/evidence`, `/help`, `/settings` — each with its own page metadata.
- Accessibility: keyboard navigable, ARIA labels, alt text, `prefers-reduced-motion` respected.

### Phase 2 (after you review Phase 1)
Moment-of-Crisis guidance (including "what NOT to do" and escalation criteria), Family Communication generator, full Evidence Log calendar with pillar filtering and CSV/PDF export, the complete 9-section Help & Info centre with legal framing and disclaimers, and Settings.
