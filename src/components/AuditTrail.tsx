import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  Download,
  Loader2,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Timer,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { clearActivity, listActivity } from "@/lib/activity.functions";
import { recordActivity } from "@/lib/activity";
import { ACTIVITY_LABELS, type ActivityRecord } from "@/lib/activity-types";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useAppState } from "@/lib/app-state";

function Stat({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: typeof Activity;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p
        className={`flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] ${
          tone === "warning" ? "text-warning" : "text-muted-foreground"
        }`}
      >
        <Icon size={14} aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function AuditTrail() {
  const { students } = useAppState();
  const fetchActivity = useServerFn(listActivity);
  const wipeActivity = useServerFn(clearActivity);
  const [events, setEvents] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await fetchActivity());
    } catch (error) {
      console.error(error);
      toast.error("We couldn't load the audit trail. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [fetchActivity]);

  useEffect(() => {
    void load();
  }, [load]);

  const nameFor = useCallback(
    (studentId: string | null) =>
      studentId ? (students.find((s) => s.id === studentId)?.preferredName ?? "—") : "—",
    [students],
  );

  const stats = useMemo(() => {
    const generations = events.filter(
      (e) => e.eventType === "generated" || e.eventType === "regenerated",
    );
    const durations = generations
      .map((e) => e.durationMs)
      .filter((d): d is number => typeof d === "number");
    const avg = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    const slowest = durations.length ? Math.max(...durations) : 0;
    return {
      generations: generations.length,
      accepted: events.filter((e) => e.eventType === "accepted").length,
      edits: events.filter((e) => e.eventType === "edited").length,
      avg,
      slowest,
      timeouts: events.filter((e) => e.eventType === "timeout").length,
      errors: events.filter((e) => e.eventType === "error").length,
    };
  }, [events]);

  function exportCsv() {
    const csv = toCsv(
      ["Timestamp", "Event", "Area", "Student", "Detail", "Duration (ms)", "Succeeded"],
      events.map((e) => [
        new Date(e.createdAt).toLocaleString("en-AU"),
        ACTIVITY_LABELS[e.eventType] ?? e.eventType,
        e.surface,
        nameFor(e.studentId),
        e.summary,
        e.durationMs ?? "",
        e.success ? "Yes" : "No",
      ]),
    );
    downloadCsv(`samebasis-ai-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    recordActivity({
      eventType: "exported",
      surface: "settings",
      summary: `Exported ${events.length} audit trail entries.`,
    });
    toast.success("Audit trail exported");
  }

  return (
    <section className="rounded-xl bg-card p-6 shadow-warm-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Activity size={20} className="text-primary" aria-hidden="true" />
            AI audit trail and trial performance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every AI output created, regenerated, edited, accepted, declined or exported is
            recorded here with a timestamp — the evidence of your review process.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="AI generations" value={String(stats.generations)} icon={Activity} />
        <Stat
          label="Average time"
          value={stats.avg ? `${(stats.avg / 1000).toFixed(1)}s` : "—"}
          icon={Timer}
        />
        <Stat
          label="Slowest"
          value={stats.slowest ? `${(stats.slowest / 1000).toFixed(1)}s` : "—"}
          icon={Timer}
        />
        <Stat label="Accepted" value={String(stats.accepted)} icon={CheckCircle2} />
        <Stat label="Teacher edits" value={String(stats.edits)} icon={CheckCircle2} />
        <Stat
          label="Timeouts"
          value={String(stats.timeouts)}
          icon={AlertTriangle}
          tone={stats.timeouts ? "warning" : "default"}
        />
        <Stat
          label="Server errors"
          value={String(stats.errors)}
          icon={AlertTriangle}
          tone={stats.errors ? "warning" : "default"}
        />
        <Stat label="Total entries" value={String(events.length)} icon={Activity} />
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">AI activity audit trail</caption>
          <thead className="bg-muted/60 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">When</th>
              <th scope="col" className="px-3 py-2 font-medium">Event</th>
              <th scope="col" className="px-3 py-2 font-medium">Area</th>
              <th scope="col" className="px-3 py-2 font-medium">Student</th>
              <th scope="col" className="px-3 py-2 font-medium">Detail</th>
              <th scope="col" className="px-3 py-2 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  <Loader2 size={16} className="mr-2 inline animate-spin" aria-hidden="true" />
                  Loading the audit trail…
                </td>
              </tr>
            )}
            {!loading && events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  No AI activity recorded yet. Generate adjustments in the Lesson Planner and the
                  trail will fill in.
                </td>
              </tr>
            )}
            {events.slice(0, 60).map((event) => (
              <tr key={event.id} className="border-t border-border align-top">
                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                  {new Date(event.createdAt).toLocaleString("en-AU", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-3 py-2 font-medium text-foreground">
                  {ACTIVITY_LABELS[event.eventType] ?? event.eventType}
                </td>
                <td className="px-3 py-2 capitalize text-muted-foreground">{event.surface}</td>
                <td className="px-3 py-2 text-muted-foreground">{nameFor(event.studentId)}</td>
                <td className="px-3 py-2 text-muted-foreground">{event.summary}</td>
                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                  {event.durationMs ? `${(event.durationMs / 1000).toFixed(1)}s` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {events.length > 60 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing the 60 most recent entries — export for the full trail.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportCsv}
          disabled={events.length === 0}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-light disabled:opacity-60"
        >
          <Download size={18} aria-hidden="true" />
          Export audit trail (CSV)
        </button>
        <button
          type="button"
          onClick={() => {
            void wipeActivity()
              .then(() => {
                setEvents([]);
                toast.success("Audit trail cleared");
              })
              .catch(() => toast.error("We couldn't clear the audit trail."));
          }}
          disabled={events.length === 0}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-destructive/40 px-4 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
        >
          <Trash2 size={16} aria-hidden="true" />
          Clear trail
        </button>
      </div>
    </section>
  );
}
