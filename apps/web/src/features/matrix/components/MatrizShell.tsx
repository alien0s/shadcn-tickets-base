import { PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSidebar } from "@/context/sidebar-context";
import { MatrizSchoolSelect } from "./MatrizSchoolSelect";
import { MatrizTable } from "./MatrizTable";
import { useMatrizSchools } from "../hooks/useMatrixSchools";

export function MatrizShell() {
  const { toggleSidebar } = useSidebar();
  const {
    selectedSchoolId,
    setSelectedSchoolId,
    selectedEducationLevelId,
    setSelectedEducationLevelId,
    schoolOptions,
    educationLevelOptions,
    isLoadingSchools,
    error,
  } = useMatrizSchools();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-7xl flex-col px-3 pb-5 pt-3 sm:px-4 sm:px-5 lg:px-8">
          <div className="flex h-full flex-col space-y-4">
            <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  onClick={toggleSidebar}
                  aria-label="Abrir/fechar menu lateral"
                >
                  <PanelRight className="h-4 w-4" aria-hidden="true" />
                </Button>

                <h1 className="text-2xl font-bold leading-tight">Matriz</h1>

                {educationLevelOptions.length > 0 ? (
                  <Tabs
                    value={selectedEducationLevelId}
                    onValueChange={setSelectedEducationLevelId}
                    className="hidden md:block"
                  >
                    <TabsList className="h-8 rounded-lg bg-muted p-1">
                      {educationLevelOptions.map((level) => (
                        <TabsTrigger
                          key={level.value}
                          value={level.value}
                          className="h-6 min-w-12 rounded-md px-3 text-xs"
                          title={level.fullName}
                        >
                          {level.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                ) : null}
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
                <MatrizSchoolSelect
                  value={selectedSchoolId}
                  options={schoolOptions}
                  isLoading={isLoadingSchools}
                  onChange={setSelectedSchoolId}
                />
              </div>
            </header>

            {educationLevelOptions.length > 0 ? (
              <div className="md:hidden">
                <Tabs value={selectedEducationLevelId} onValueChange={setSelectedEducationLevelId}>
                  <TabsList className="h-9 w-full justify-start rounded-lg bg-muted p-1">
                    {educationLevelOptions.map((level) => (
                      <TabsTrigger
                        key={level.value}
                        value={level.value}
                        className="h-7 min-w-12 rounded-md px-3 text-xs"
                        title={level.fullName}
                      >
                        {level.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
                {error}
              </div>
            ) : (
              <section className="overflow-hidden rounded-xl border border-border bg-card">
                <MatrizTable
                  schoolId={selectedSchoolId}
                  educationLevelId={selectedEducationLevelId}
                />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
