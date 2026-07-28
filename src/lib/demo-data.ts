export type NccdCategory = "Cognitive" | "Social-Emotional" | "Physical" | "Sensory";
export type NccdLevel = "QDTP" | "Supplementary" | "Substantial" | "Extensive";
export type NccdPillar = "Consultation" | "Adjustment" | "Monitoring" | "Review";
export type AdjustmentStatus = "suggested" | "modified" | "implemented" | "declined" | "saved";

export interface StudentProfile {
  nccdCategory: NccdCategory;
  nccdLevel: NccdLevel;
  primaryDiagnosis: string | null;
  functionalDescription: string;
  culturalBackground: string | null;
  languagesSpoken: string | null;
  ealdLevel: string | null;
  traumaFlags: string | null;
  knownTriggers: string | null;
  calmingStrategies: string | null;
  familyCommunicationPref: string | null;
  strengths: string | null;
  iepGoals: string | null;
}

export interface Student {
  id: string;
  classId: string;
  firstName: string;
  lastName: string;
  preferredName: string;
  profile: StudentProfile;
}

export interface ClassRecord {
  id: string;
  name: string;
  yearLevel: number;
  subject: string;
}

export interface CurriculumTopic {
  id: string;
  subject: string;
  yearLevel: number;
  topic: string;
  strand: string;
  description: string;
}

export interface AdjustmentRecord {
  id: string;
  studentId: string;
  classId: string;
  curriculumTopicId: string;
  activityDescription: string;
  generatedAdjustment: string;
  udlBenefit: string;
  culturalNote: string | null;
  traumaNote: string | null;
  rationale: string;
  nccdPillar: NccdPillar;
  evidenceType: NccdLevel;
  teacherAction: string | null;
  status: AdjustmentStatus;
  createdAt: string;
  implementedAt: string | null;
}

export interface EvidenceLog {
  id: string;
  adjustmentId: string;
  studentId: string;
  logDate: string;
  weekNumber: number;
  pillar: NccdPillar;
  evidenceSummary: string;
  source: "AI-generated" | "teacher-edited";
  createdAt: string;
}

export const demoClass: ClassRecord = {
  id: "class-y8-science-b",
  name: "Year 8 Science B",
  yearLevel: 8,
  subject: "Science",
};

export const demoClasses: ClassRecord[] = [demoClass];

export const demoStudents: Student[] = [
  {
    id: "stu-aisha",
    classId: demoClass.id,
    firstName: "Aisha",
    lastName: "Al-Hassan",
    preferredName: "Aisha",
    profile: {
      nccdCategory: "Social-Emotional",
      nccdLevel: "Substantial",
      primaryDiagnosis: "Anxiety disorder, PTSD",
      functionalDescription:
        "Becomes overwhelmed quickly in loud or crowded settings and will withdraw rather than ask for help. Needs a predictable entry point into group tasks and a visible exit to a calm space.",
      culturalBackground: "Iraqi refugee, 18 months in Australia",
      languagesSpoken: "Arabic (home), English (emerging)",
      ealdLevel: "A2",
      traumaFlags: "Refugee camp exposure; sudden loud noises trigger hypervigilance",
      knownTriggers: "Loud sudden noises, crowded group work, fire drills",
      calmingStrategies:
        "Quiet corner near the window, drawing breaks, Arabic music through headphones",
      familyCommunicationPref: "Arabic via phone, not email. Avoid Friday afternoons.",
      strengths: "Excellent visual memory, strong in art, kind to younger students",
      iepGoals: "Participate in 2 of 3 group activities per week with scaffolded entry",
    },
  },
  {
    id: "stu-james",
    classId: demoClass.id,
    firstName: "James",
    lastName: "O'Brien",
    preferredName: "James",
    profile: {
      nccdCategory: "Cognitive",
      nccdLevel: "Supplementary",
      primaryDiagnosis: "ADHD (inattentive type)",
      functionalDescription:
        "Loses the thread of multi-step verbal instructions and drifts during unstructured time. Re-engages fast when the task is physical and the steps are written down.",
      culturalBackground: "Australian-born",
      languagesSpoken: "English",
      ealdLevel: "NA",
      traumaFlags: null,
      knownTriggers: "Long verbal instructions, unstructured time",
      calmingStrategies: "Movement breaks, fidget tools, written instructions",
      familyCommunicationPref: "Email, either parent",
      strengths: "Exceptional at hands-on building tasks, peer mediator",
      iepGoals: "Use visual timers for task transitions",
    },
  },
  {
    id: "stu-thi",
    classId: demoClass.id,
    firstName: "Thi",
    lastName: "Nguyen",
    preferredName: "Thi",
    profile: {
      nccdCategory: "Cognitive",
      nccdLevel: "Supplementary",
      primaryDiagnosis: "Specific Learning Disorder (reading)",
      functionalDescription:
        "Decoding unfamiliar text is slow and effortful, which masks strong reasoning. Comprehension is age-appropriate when text is previewed or delivered orally.",
      culturalBackground: "Vietnamese, 3 years in Australia",
      languagesSpoken: "Vietnamese (home), English",
      ealdLevel: "B1",
      traumaFlags: null,
      knownTriggers: "Reading aloud in front of the class, timed tests",
      calmingStrategies: "Preview texts before class, partner reading",
      familyCommunicationPref: "Written notes home, translated where possible",
      strengths: "Strong oral storyteller, mathematics reasoning",
      iepGoals: "Provide texts 24 hours ahead, allow oral responses",
    },
  },
  {
    id: "stu-sarah",
    classId: demoClass.id,
    firstName: "Sarah",
    lastName: "Williams",
    preferredName: "Sarah",
    profile: {
      nccdCategory: "Physical",
      nccdLevel: "QDTP",
      primaryDiagnosis: null,
      functionalDescription:
        "Fine motor difficulties make sustained handwriting painful and slow. Written output does not reflect her thinking unless she can type or dictate.",
      culturalBackground: "Australian-born",
      languagesSpoken: "English",
      ealdLevel: "NA",
      traumaFlags: null,
      knownTriggers: "Handwriting-intensive tasks",
      calmingStrategies: "Keyboard access, speech-to-text, scribe support",
      familyCommunicationPref: "Email",
      strengths: "Verbal reasoning, leadership in discussions",
      iepGoals: "Use digital tools for all written output",
    },
  },
  {
    id: "stu-bakari",
    classId: demoClass.id,
    firstName: "Bakari",
    lastName: "Mbei",
    preferredName: "Bakari",
    profile: {
      nccdCategory: "Social-Emotional",
      nccdLevel: "Substantial",
      primaryDiagnosis: null,
      functionalDescription:
        "No formal diagnosis. Trauma impacts and grief affect his tolerance for unpredictability and direct confrontation. Responds well to advance notice and genuine choice.",
      culturalBackground: "South Sudanese refugee, 4 years in Australia",
      languagesSpoken: "Dinka (home), Arabic (some), English",
      ealdLevel: "B1",
      traumaFlags: "Grief — lost siblings; displacement history",
      knownTriggers:
        "Discussions about family, unexpected schedule changes, authority confrontation",
      calmingStrategies: "Predictable routines, choice in seating, male mentor check-ins",
      familyCommunicationPref: "In person with community liaison present",
      strengths: "Soccer, peer support for other CALD students, oral history",
      iepGoals:
        "Advance notice of schedule changes; option to opt out of family-themed assignments",
    },
  },
  {
    id: "stu-emma",
    classId: demoClass.id,
    firstName: "Emma",
    lastName: "Chen",
    preferredName: "Emma",
    profile: {
      nccdCategory: "Sensory",
      nccdLevel: "Supplementary",
      primaryDiagnosis: "Autism Spectrum Disorder (Level 1)",
      functionalDescription:
        "Sensory load builds across a lesson rather than spiking. Needs a scheduled break before overload, and advance warning of any change to the physical setup.",
      culturalBackground: "Australian-born, Chinese heritage",
      languagesSpoken: "English only",
      ealdLevel: "NA",
      traumaFlags: null,
      knownTriggers: "Fluorescent lighting, overlapping noises, unexpected touch",
      calmingStrategies:
        "Dimmed lighting option, noise-reducing headphones, advance warning of physical activities",
      familyCommunicationPref: "Email, prefers written summaries",
      strengths: "Pattern recognition, coding, detailed factual recall",
      iepGoals:
        "Sensory break every 45 minutes; advance notice of physical education changes",
    },
  },
];

export const demoTopics: CurriculumTopic[] = [
  {
    id: "topic-chemical-reactions",
    subject: "Science",
    yearLevel: 8,
    topic: "Chemical Reactions",
    strand: "Science Understanding",
    description:
      "Chemical change rearranges atoms to form new substances; students observe and describe evidence of reactions.",
  },
  {
    id: "topic-cells-systems",
    subject: "Science",
    yearLevel: 8,
    topic: "Cells and Systems",
    strand: "Science Understanding",
    description:
      "Cells as the basic unit of life, and how body systems coordinate to keep organisms functioning.",
  },
  {
    id: "topic-forces-motion",
    subject: "Science",
    yearLevel: 8,
    topic: "Forces and Motion",
    strand: "Science Understanding",
    description:
      "Balanced and unbalanced forces, and how they change the motion of everyday objects.",
  },
  {
    id: "topic-earth-space",
    subject: "Science",
    yearLevel: 8,
    topic: "Earth and Space",
    strand: "Science Understanding",
    description:
      "Rock cycle, Earth's structure and the processes that shape the surface over time.",
  },
  {
    id: "topic-ecosystems",
    subject: "Science",
    yearLevel: 8,
    topic: "Ecosystems and Biodiversity",
    strand: "Science Understanding",
    description:
      "Energy flow and interdependence in ecosystems, and what happens when a system is disturbed.",
  },
  {
    id: "topic-states-matter",
    subject: "Science",
    yearLevel: 8,
    topic: "States of Matter",
    strand: "Science Understanding",
    description:
      "Particle model explanations for solids, liquids, gases and changes of state.",
  },
  {
    id: "topic-energy-transfers",
    subject: "Science",
    yearLevel: 8,
    topic: "Energy Transfers",
    strand: "Science Understanding",
    description:
      "How energy is transferred and transformed between objects and stores in everyday systems.",
  },
  {
    id: "topic-scientific-inquiry",
    subject: "Science",
    yearLevel: 8,
    topic: "Scientific Inquiry Methods",
    strand: "Science Inquiry Skills",
    description:
      "Planning fair tests, controlling variables, recording data and drawing evidence-based conclusions.",
  },
];

export function studentInitials(student: Student): string {
  return `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
}

export function isCald(student: Student): boolean {
  const bg = student.profile.culturalBackground;
  return !!bg && bg !== "Australian-born";
}

export function hasTrauma(student: Student): boolean {
  return !!student.profile.traumaFlags;
}
