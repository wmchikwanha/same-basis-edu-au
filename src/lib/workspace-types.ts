export interface TeacherProfile {
  id: string;
  fullName: string;
  schoolName: string;
  state: string;
  role: string;
  yearLevel: number;
  assessmentContext: string;
  aiConsent: boolean;
  aiConsentAt: string | null;
}
