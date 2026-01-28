import { useState } from "react";
import { AppLayout } from "@/layout/AppLayout";
import { UsersHeader } from "@/features/users/components/UsersHeader";
import { UsersToolbar } from "@/features/users/components/UsersToolbar";
import { UsersTable } from "@/features/users/components/UsersTable";
import { NewUserDialog } from "@/features/users/components/NewUserDialog";
import { useUsers } from "@/features/users/hooks/useUsers";

export function UsersPage() {
  const {
    search,
    setSearch,
    filteredUsers,
    paginatedUsers,
    page,
    totalPages,
    setPage,
    entities,
    roles,
    selectedEntities,
    selectedRoles,
    toggleEntity,
    toggleRole,
  } = useUsers();
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);

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
                    onNewUserClick={() => setIsNewUserOpen(true)}
                    entities={entities}
                    roles={roles}
                    selectedEntities={selectedEntities}
                    selectedRoles={selectedRoles}
                    onToggleEntity={toggleEntity}
                    onToggleRole={toggleRole}
                  />
                </div>
                <UsersToolbar
                  search={search}
                  onSearchChange={setSearch}
                  variant="search"
                  entities={entities}
                  roles={roles}
                  selectedEntities={selectedEntities}
                  selectedRoles={selectedRoles}
                  onToggleEntity={toggleEntity}
                  onToggleRole={toggleRole}
                />
              </div>
              <UsersTable
                users={paginatedUsers}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </div>
        </div>
      </div>
      <NewUserDialog open={isNewUserOpen} onOpenChange={setIsNewUserOpen} />
    </AppLayout>
  );
}
