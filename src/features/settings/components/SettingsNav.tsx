import { useCallback } from "react";
import { cn } from "@/lib/utils";
import type { SettingsSection, SettingsSectionId } from "../types";

type SettingsNavProps = {
  sections: readonly SettingsSection[]; // ✅
  activeSection: SettingsSectionId;
  onSelect: (sectionId: SettingsSectionId) => void;
};


export function SettingsNav({
  sections,
  activeSection,
  onSelect,
}: SettingsNavProps) {
  // ✅ handler estável + sem inline no map (usa dataset)
  const handleSelect = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const id = e.currentTarget.dataset.sectionId as SettingsSectionId | undefined;
      if (!id) return;
      onSelect(id);
    },
    [onSelect]
  );

  return (
    <nav
      className="md:pr-6 md:border-r md:border-border md:self-stretch"
      aria-label="Navegação de seções de configurações" // ✅ a11y
    >
      <div className="py-1 flex gap-2 overflow-x-auto md:flex-col md:space-y-1 md:overflow-visible">
        {sections.map((section) => {
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              data-section-id={section.id} // ✅ usado pelo handler estável
              className={cn(
                "flex items-center justify-center md:justify-start rounded-md px-2.5 sm:px-3 py-2.5 text-sm transition-colors whitespace-nowrap text-center md:text-left",
                "min-w-[96px] sm:min-w-[110px] md:min-w-0",
                "hover:bg-accent hover:text-foreground",
                isActive
                  ? "sidebar-nav-active hover:bg-primary/10 hover:text-primary dark:hover:bg-gray-800 dark:hover:text-foreground"
                  : "text-muted-foreground"
              )}
              onClick={handleSelect}
              aria-current={isActive ? "page" : undefined} // ✅ a11y: indica ativo
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
