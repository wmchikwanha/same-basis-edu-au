/**
 * Single source of truth for product branding. Rename the product here and it
 * updates everywhere: sidebar, page titles, footer, help copy.
 */
export const brand = {
  name: "SameBasis",
  tagline: "Every student. Same basis for learning.",
  positioning:
    "The only teaching tool that understands the intersection of disability, culture, and curriculum.",
  developer: "Walter C",
  developerFullName: "Walter Chikwanha",
  developerEmail: "wmchikwanha@gmail.com",
  copyrightYear: 2026,
} as const;

export const footerText = `${brand.name} | Developed by ${brand.developer} | © ${brand.copyrightYear} All Rights Reserved`;

/** Demo persona shown in the top bar while running in demo mode. */
export const demoUser = {
  fullName: "Teacher Testing",
  firstName: "Teacher",
  schoolName: "Main Stream High School",
  state: "NSW",
  role: "Classroom Teacher",
  initials: "TT",
} as const;
