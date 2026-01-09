import { useSidebar } from "@/context/sidebar-context";
import { Button } from "@/components/ui/button";
import { PanelRight } from "lucide-react";
import { useEntities } from "../hooks/useEntities";
import { useSettingsSections } from "../hooks/useSettingsSections";
import { useTwoFactor } from "../hooks/useTwoFactor";
import { ProfileSection } from "./ProfileSection";
import { SecuritySection } from "./SecuritySection";
import { PlaceholderSection } from "./PlaceholderSection";
import { SettingsNav } from "./SettingsNav";

export function SettingsShell() {
  const { toggleSidebar } = useSidebar();
  const { activeSection, sections, setActiveSection } = useSettingsSections();
  const { entities, selectedEntity, setSelectedEntity } = useEntities();
  const { twoFactorEnabled, setTwoFactorEnabled } = useTwoFactor();

  const renderContent = () => {
    if (activeSection === "general") {
      return (
        <ProfileSection
          entities={entities}
          selectedEntity={selectedEntity}
          onChangeEntity={setSelectedEntity}
        />
      );
    }
    if (activeSection === "security") {
      return (
        <SecuritySection
          twoFactorEnabled={twoFactorEnabled}
          onToggleTwoFactor={setTwoFactorEnabled}
        />
      );
    }
    return (
      <PlaceholderSection
        title={sections.find((section) => section.id === activeSection)?.label || "Em breve"}
      />
    );
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="h-14 border-b border-border flex items-center">
        <div className="mx-auto max-w-6xl w-full flex items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={toggleSidebar}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Configuracões</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[230px,1fr] items-start md:items-stretch">
            <SettingsNav
              sections={sections}
              activeSection={activeSection}
              onSelect={setActiveSection}
            />
            <section className="flex flex-col">{renderContent()}</section>
          </div>
        </div>
      </div>
    </main>
  );
}
