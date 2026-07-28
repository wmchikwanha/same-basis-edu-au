import { cn } from "@/lib/utils";
import { studentInitials, type Student } from "@/lib/demo-data";

const palettes = [
  "bg-primary/15 text-primary",
  "bg-accent/30 text-foreground",
  "bg-info-soft text-info",
  "bg-success-soft text-primary",
  "bg-ai-soft text-ai-foreground",
  "bg-warning-soft text-warning",
];

function paletteFor(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return palettes[sum % palettes.length];
}

export function StudentAvatar({
  student,
  size = "md",
}: {
  student: Student;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
  };
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizes[size],
        paletteFor(student.id),
      )}
    >
      {studentInitials(student)}
    </span>
  );
}
