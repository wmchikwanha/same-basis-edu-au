import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  demoClasses,
  demoStudents,
  demoTopics,
  type AdjustmentRecord,
  type EvidenceLog,
  type Student,
} from "./demo-data";

const STORAGE_KEY = "samebasis.demo.v1";

interface PersistedState {
  adjustments: AdjustmentRecord[];
  evidenceLogs: EvidenceLog[];
}

interface AppState extends PersistedState {
  classes: typeof demoClasses;
  students: Student[];
  topics: typeof demoTopics;
  hydrated: boolean;
  addAdjustment: (record: AdjustmentRecord) => void;
  updateAdjustment: (id: string, patch: Partial<AdjustmentRecord>) => void;
  addEvidenceLog: (log: EvidenceLog) => void;
  resetDemo: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

export const TERM_START = new Date(2026, 6, 13); // Monday 13 July 2026

export function weekNumberFor(date: Date): number {
  const days = Math.floor((date.getTime() - TERM_START.getTime()) / 86_400_000);
  return Math.min(10, Math.max(1, Math.floor(days / 7) + 1));
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [adjustments, setAdjustments] = useState<AdjustmentRecord[]>([]);
  const [evidenceLogs, setEvidenceLogs] = useState<EvidenceLog[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        setAdjustments(parsed.adjustments ?? []);
        setEvidenceLogs(parsed.evidenceLogs ?? []);
      }
    } catch {
      /* demo data is disposable — ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ adjustments, evidenceLogs } satisfies PersistedState),
      );
    } catch {
      /* storage full or unavailable — the demo still works in memory */
    }
  }, [adjustments, evidenceLogs, hydrated]);

  const addAdjustment = useCallback((record: AdjustmentRecord) => {
    setAdjustments((prev) => [record, ...prev]);
  }, []);

  const updateAdjustment = useCallback((id: string, patch: Partial<AdjustmentRecord>) => {
    setAdjustments((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const addEvidenceLog = useCallback((log: EvidenceLog) => {
    setEvidenceLogs((prev) => [log, ...prev]);
  }, []);

  const resetDemo = useCallback(() => {
    setAdjustments([]);
    setEvidenceLogs([]);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      classes: demoClasses,
      students: demoStudents,
      topics: demoTopics,
      adjustments,
      evidenceLogs,
      hydrated,
      addAdjustment,
      updateAdjustment,
      addEvidenceLog,
      resetDemo,
    }),
    [adjustments, evidenceLogs, hydrated, addAdjustment, updateAdjustment, addEvidenceLog, resetDemo],
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
