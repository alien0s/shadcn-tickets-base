import type { ProfileFieldProps } from "../types";

export function ProfileField({
  title,
  description,
  children,
}: ProfileFieldProps) {
  return (
    <div
      role="group" // ✅ semântica: agrupa label + controle
      aria-labelledby={`${title}-label`} // ✅ a11y (id lógico)
      className="flex flex-col gap-3 py-4 sm:flex-row sm:gap-6 sm:items-center"
    >
      <div className="w-full sm:w-[200px]">
        <p
          id={`${title}-label`}
          className="text-sm font-semibold text-foreground"
        >
          {title}
        </p>

        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>

      {/* Conteúdo do campo (input, select, actions, etc.) */}
      <div className="flex-1 space-y-3">{children}</div>
    </div>
  );
}
