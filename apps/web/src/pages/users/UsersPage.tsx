import { useState } from "react";
import { AppLayout } from "@/layout/AppLayout";
import { UsersHeader } from "@/features/users/components/UsersHeader";
import { UsersToolbar } from "@/features/users/components/UsersToolbar";
import { UsersTable } from "@/features/users/components/UsersTable";
import { NewUserDialog } from "@/features/users/components/NewUserDialog";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useAuth } from "@/features/auth";

// ID fixo do role root (antigo Admin global)
const ROOT_ROLE_ID = '650e8400-e29b-41d4-a716-446655440000';

export function UsersPage() {
  const {
    search,
    setSearch,
    filteredUsers,
    page,
    total,
    pageSize,
    setPage,
    entities,
    roles,
    selectedEntities,
    selectedRoles,
    toggleEntity,
    toggleRole,
    isLoading,
    error,
    removeUser,
    updateUser,
    addUser,
  } = useUsers();

  const { user: currentUser } = useAuth();
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);

  const isAdmin = currentUser?.role_id === ROOT_ROLE_ID;

  return (
    <AppLayout>
      <div className="h-full flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 pt-3 pb-5 sm:px-5 lg:px-8 h-full flex flex-col">
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <UsersHeader count={total} />
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
                users={filteredUsers}
                page={page}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
                isLoading={isLoading}
                error={error}
                onUserDeleted={removeUser}
                onUserUpdated={updateUser}
                currentUserId={currentUser?.id}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>
      </div>
      <NewUserDialog
        open={isNewUserOpen}
        onOpenChange={setIsNewUserOpen}
        onCreated={addUser}
      />
    </AppLayout>
  );
}
