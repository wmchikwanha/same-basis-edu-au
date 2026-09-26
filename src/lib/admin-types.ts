import type { StudentProfile } from "./demo-data";

export interface SchoolTeacher {
  id: string;
  fullName: string;
  email: string;
  role: string;
  yearLevel: number;
  active: boolean;
  isAdmin: boolean;
  aiConsent: boolean;
  aiConsentAt: string | null;
  joinedAt: string;
}

export interface SchoolData {
  school: { id: string; name: string };
  currentUserId: string;
  teachers: SchoolTeacher[];
  classes: { id: string; teacherId: string; name: string; yearLevel: number; subject: string }[];
  students: {
    id: string;
    teacherId: string;
    classId: string;
    firstName: string;
    lastName: string;
    preferredName: string;
    profile: StudentProfile;
  }[];
  adjustments: {
    id: string;
    teacherId: string;
    studentId: string;
    status: string;
    pillar: string;
    text: string;
    teacherAction: string | null;
    createdAt: string;
  }[];
  evidence: {
    id: string;
    teacherId: string;
    studentId: string;
    pillar: string;
    summary: string;
    logDate: string;
    source: string;
  }[];
  activity: {
    id: string;
    teacherId: string;
    studentId: string | null;
    eventType: string;
    surface: string;
    summary: string;
    durationMs: number | null;
    success: boolean;
    createdAt: string;
  }[];
  flags: {
    id: string;
    teacherId: string;
    studentId: string | null;
    surface: string;
    category: string;
    phrase: string;
    reason: string;
    severity: string;
    excerpt: string;
    detector: string;
    status: string;
    resolutionNote: string | null;
    resolvedAt: string | null;
    createdAt: string;
  }[];
  governance: {
    id: string;
    actorId: string;
    actorName: string;
    category: string;
    eventType: string;
    targetType: string | null;
    targetId: string | null;
    summary: string;
    createdAt: string;
  }[];
}
