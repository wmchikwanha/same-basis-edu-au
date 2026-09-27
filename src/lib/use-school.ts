import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSchoolData } from "./admin.functions";

export function useSchool() {
  const fetchSchool = useServerFn(getSchoolData);
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["school"], queryFn: () => fetchSchool() });
  return { ...query, reload: () => qc.invalidateQueries({ queryKey: ["school"] }) };
}

export const inputCls =
  "min-h-[44px] w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground";
export const primaryBtn =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-60";
export const secondaryBtn =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60";
export const card = "rounded-xl bg-card p-5 shadow-warm-sm";
