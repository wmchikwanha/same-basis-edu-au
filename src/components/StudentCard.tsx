import { isCald, hasTrauma, type Student } from "@/lib/demo-data";
import { StudentAvatar } from "./StudentAvatar";
import { CaldBadge, NccdLevelBadge, TraumaBadge } from "./Badges";

export function StudentCard({
  student,
  onClick,
}: {
  student: Student;
  onClick: (student: Student) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(student)}
      className="group flex w-full flex-col gap-4 rounded-xl bg-card p-5 text-left shadow-warm-sm transition-shadow hover:shadow-warm-md"
    >
      <div className="flex items-start gap-3">
        <StudentAvatar student={student} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground group-hover:text-primary">
            {student.preferredName} {student.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {student.profile.nccdCategory}
            {student.profile.primaryDiagnosis
              ? ` · ${student.profile.primaryDiagnosis}`
              : " · No diagnosis disclosed"}
          </p>
        </div>
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">
        {student.profile.functionalDescription}
      </p>
      <div className="flex flex-wrap gap-2">
        <NccdLevelBadge level={student.profile.nccdLevel} />
        {isCald(student) && <CaldBadge label={student.profile.culturalBackground ?? undefined} />}
        {hasTrauma(student) && <TraumaBadge />}
      </div>
    </button>
  );
}
