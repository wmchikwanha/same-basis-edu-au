import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type {
  AdjustmentRecord,
  ClassRecord,
  CurriculumTopic,
  EvidenceLog,
  Student,
} from "./demo-data";
import { TERM_START, newId, weekNumberFor } from "./term";
import {
  loadWorkspace,
  resetWorkspace,
  saveAdjustment,
  saveEvidenceLog,
  updateProfile,
} from "./workspace.functions";
import type { TeacherProfile } from "./workspace-types";

export { TERM_START, newId, weekNumberFor };

interface AppState {
  profile: TeacherProfile | null;
  classes: ClassRecord[];
  students: Student[];
  topics: CurriculumTopic[];
  adjustments: AdjustmentRecord[];
  evidenceLogs: EvidenceLog[];
  hydrated: boolean;
  loading: boolean;
  addAdjustment: (record: AdjustmentRecord) => void;
  updateAdjustment: (id: string, patch: Partial<AdjustmentRecord>) => void;
  addEvidenceLog: (log: EvidenceLog) => void;
  saveProfile: (patch: Omit<TeacherProfile, "id">) => Promise<void>;
  resetDemo: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AppStateContext = createContext<AppState | null>(null);

function reportFailure(error: unknown) {
  console.error(error);
  toast.error("We couldn't save that just now. Your change is still on screen — try again.");
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [topics, setTopics] = useState<CurriculumTopic[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentRecord[]>([]);
  const [evidenceLogs, setEvidenceLogs] = useState<EvidenceLog[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);

  const applyPayload = useCallback(
    (payload: Awaited<ReturnType<typeof loadWorkspace>>) => {
      setProfile(payload.profile);
      setClasses(payload.classes);
      setStudents(payload.students);
      setTopics(payload.topics);
      setAdjustments(payload.adjustments);
      setEvidenceLogs(payload.evidenceLogs);
    },
    [],
  );

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setProfile(null);
      setClasses([]);
      setStudents([]);
      setTopics([]);
      setAdjustments([]);
      setEvidenceLogs([]);
      setHydrated(true);
      return;
    }
    setLoading(true);
    try {
      applyPayload(await loadWorkspace());
    } catch (error) {
      console.error(error);
      toast.error("We couldn't load your classroom. Please refresh the page.");
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }, [applyPayload]);

  useEffect(() => {
    void refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void refresh();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const addAdjustment = useCallback((record: AdjustmentRecord) => {
    setAdjustments((prev) => [record, ...prev]);
    void saveAdjustment({ data: record }).catch(reportFailure);
  }, []);

  const updateAdjustment = useCallback((id: string, patch: Partial<AdjustmentRecord>) => {
    setAdjustments((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
      const updated = next.find((a) => a.id === id);
      if (updated) void saveAdjustment({ data: updated }).catch(reportFailure);
      return next;
    });
  }, []);

  const addEvidenceLog = useCallback((log: EvidenceLog) => {
    setEvidenceLogs((prev) => [log, ...prev]);
    void saveEvidenceLog({ data: log }).catch(reportFailure);
  }, []);

  const saveProfile = useCallback(async (patch: Omit<TeacherProfile, "id">) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    await updateProfile({ data: patch });
  }, []);

  const resetDemo = useCallback(async () => {
    setLoading(true);
    try {
      await resetWorkspace();
      applyPayload(await loadWorkspace());
    } finally {
      setLoading(false);
    }
  }, [applyPayload]);

  const value = useMemo<AppState>(
    () => ({
      profile,
      classes,
      students,
      topics,
      adjustments,
      evidenceLogs,
      hydrated,
      loading,
      addAdjustment,
      updateAdjustment,
      addEvidenceLog,
      saveProfile,
      resetDemo,
      refresh,
    }),
    [
      profile,
      classes,
      students,
      topics,
      adjustments,
      evidenceLogs,
      hydrated,
      loading,
      addAdjustment,
      updateAdjustment,
      addEvidenceLog,
      saveProfile,
      resetDemo,
      refresh,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}

export function useStudent(studentId: string | null | undefined): Student | undefined {
  const { students } = useAppState();
  return students.find((s) => s.id === studentId);
}
