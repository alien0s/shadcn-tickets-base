import { AppLayout } from "@/layout/AppLayout";
import { UsersHeader } from "@/features/users/components/UsersHeader";
import { UsersToolbar } from "@/features/users/components/UsersToolbar";
import { UsersTable } from "@/features/users/components/UsersTable";
import { useUsers } from "@/features/users/hooks/useUsers";

export function UsersPage() {
  const { search, setSearch, filteredUsers } = useUsers();

  return (
    <AppLayout>
      <div className="h-full flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 pt-3 pb-5 sm:px-5 lg:px-8 h-full flex flex-col">
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <UsersHeader count={filteredUsers.length} />
                  <UsersToolbar
                    search={search}
                    onSearchChange={setSearch}
                  />
                </div>
                <UsersToolbar
                  search={search}
                  onSearchChange={setSearch}
                  variant="search"
                />
              </div>
              <UsersTable users={filteredUsers} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
