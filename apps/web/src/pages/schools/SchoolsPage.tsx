import { AppLayout } from "@/layout/AppLayout";
import { SchoolsGrid, SchoolsHeader, SchoolsToolbar, useSchools } from "@/features/schools";
import { toast } from "sonner";

export function SchoolsPage() {
  const {
    search,
    setSearch,
    schools,
    total,
    isLoading,
    error,
  } = useSchools();

  return (
    <AppLayout>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="mx-auto flex h-full max-w-7xl flex-col px-3 pb-5 pt-3 sm:px-5 lg:px-8">
            <div className="flex h-full flex-col space-y-4">
              <div className="flex items-center justify-between gap-2">
                <SchoolsHeader count={total} />
                <SchoolsToolbar
                  search={search}
                  onSearchChange={setSearch}
                  onCreateSchool={() => toast.info("Criação de escola em breve.")}
                />
              </div>

              <SchoolsGrid
                schools={schools}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
