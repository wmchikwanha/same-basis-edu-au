import { cn } from "@/lib/utils";
import type { NccdLevel, NccdPillar } from "@/lib/demo-data";
import { Circle, Layers, Mountain, Waves, Sparkles, Globe2, ShieldAlert } from "lucide-react";

const levelStyles: Record<NccdLevel, { className: string; icon: typeof Circle }> = {
  QDTP: { className: "bg-neutral-badge-soft text-muted-foreground", icon: Circle },
  Supplementary: { className: "bg-info-soft text-info", icon: Layers },
  Substantial: { className: "bg-ai-soft text-ai-foreground", icon: Waves },
  Extensive: { className: "bg-warning-soft text-warning", icon: Mountain },
};

export function NccdLevelBadge({
  level,
  className,
}: {
  level: NccdLevel;
  className?: string;
}) {
  const style = levelStyles[level];
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        style.className,
        className,
      )}
    >
      <Icon size={12} aria-hidden="true" />
      {level}
    </span>
  );
}

export function CaldBadge({ label }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-accent/25 px-2.5 py-1 text-xs font-medium text-foreground"
      title={label}
    >
      <Globe2 size={12} aria-hidden="true" />
      CALD
    </span>
  );
}

export function TraumaBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning">
      <ShieldAlert size={12} aria-hidden="true" />
      Trauma-informed
    </span>
  );
}

export function AiBadge({ label = "AI-generated" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ai-soft px-2.5 py-1 text-xs font-medium text-ai-foreground">
      <Sparkles size={12} aria-hidden="true" />
      {label}
    </span>
  );
}

export function PillarBadge({ pillar }: { pillar: NccdPillar }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary">
      NCCD · {pillar}
    </span>
  );
}
