import { cn } from "@/lib/utils";
import type { SettingsSection, SettingsSectionId } from "../types";

type SettingsNavProps = {
  sections: SettingsSection[];
  activeSection: SettingsSectionId;
  onSelect: (sectionId: SettingsSectionId) => void;
};

export function SettingsNav({
  sections,
  activeSection,
  onSelect,
}: SettingsNavProps) {
  return (
    <nav className="md:pr-6 md:border-r md:border-border md:self-stretch">
      <div className="py-1 flex gap-2 overflow-x-auto md:flex-col md:space-y-1 md:overflow-visible">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={cn(
              "flex items-center justify-center md:justify-start rounded-md px-2.5 sm:px-3 py-2.5 text-sm transition-colors whitespace-nowrap text-center md:text-left",
              "min-w-[96px] sm:min-w-[110px] md:min-w-0",
              "hover:bg-accent hover:text-foreground",
              activeSection === section.id
                ? "sidebar-nav-active hover:bg-primary/10 hover:text-primary dark:hover:bg-gray-800 dark:hover:text-foreground"
                : "text-muted-foreground"
            )}
            onClick={() => onSelect(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
