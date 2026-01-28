import { useCallback, useMemo } from "react";
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

  // ✅ handlers estáveis (evita passar funções instáveis para children)
  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const handleSelectSection = useCallback(
    (sectionId: typeof activeSection) => {
      setActiveSection(sectionId);
    },
    [setActiveSection]
  );

  const handleChangeEntity = useCallback(
    (value: string) => {
      setSelectedEntity(value);
    },
    [setSelectedEntity]
  );

  const handleToggleTwoFactor = useCallback(
    (next: boolean) => {
      setTwoFactorEnabled(next);
    },
    [setTwoFactorEnabled]
  );

  // ✅ calcula label do placeholder uma vez
  const activeSectionLabel = useMemo(() => {
    return sections.find((section) => section.id === activeSection)?.label || "Em breve";
  }, [sections, activeSection]);

  // ✅ conteúdo memoizado (evita re-render extra e find duplicado)
  const content = useMemo(() => {
    if (activeSection === "general") {
      return (
        <ProfileSection
          entities={entities}
          selectedEntity={selectedEntity}
          onChangeEntity={handleChangeEntity}
        />
      );
    }

    if (activeSection === "security") {
      return (
        <SecuritySection
          twoFactorEnabled={twoFactorEnabled}
          onToggleTwoFactor={handleToggleTwoFactor}
        />
      );
    }

    return <PlaceholderSection title={activeSectionLabel} />;
  }, [
    activeSection,
    entities,
    selectedEntity,
    twoFactorEnabled,
    handleChangeEntity,
    handleToggleTwoFactor,
    activeSectionLabel,
  ]);

  return (
    <main className="flex-1 flex flex-col overflow-hidden" role="main">
      <div className="h-14 border-b border-border flex items-center">
        <div className="mx-auto max-w-6xl w-full flex items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              type="button" // ✅ evita submit acidental
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={handleToggleSidebar}
              aria-label="Abrir/fechar menu lateral" // ✅ a11y
            >
              <PanelRight className="h-4 w-4" aria-hidden="true" />
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
              onSelect={handleSelectSection}
            />

            <section className="flex flex-col">{content}</section>
          </div>
        </div>
      </div>
    </main>
  );
}
