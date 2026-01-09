import type { ProfileFieldProps } from "../types";

export function ProfileField({ title, description, children }: ProfileFieldProps) {
  return (
    <div
      className={[
        "flex flex-col gap-3 py-4 sm:flex-row sm:gap-6 sm:items-center",
      ].join(" ")}
    >
      <div className="w-full sm:w-[200px]">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex-1 space-y-3">{children}</div>
    </div>
  );
}
