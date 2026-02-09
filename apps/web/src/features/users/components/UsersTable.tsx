import { memo } from "react";
import { Separator } from "@/components/ui/separator";
import { NotFoundUFO } from "@/components/illustrations/NotFoundUFO";
import type { UserRecord } from "../data/mockUsers";
import { UserRow, UserRowSkeleton } from "./UserRow";
import { UsersPagination } from "./UsersPagination";

type UsersTableProps = {
  users: UserRecord[];
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  isLoading?: boolean;
  error?: string | null;
  onUserDeleted: (userId: string) => void;
  onUserUpdated?: (userId: string, data: { name?: string; last_name?: string; email?: string; entity_id?: string; department_id?: string; role_id?: string; is_active?: boolean }) => void;
  currentUserId?: string;
   isAdmin?: boolean; 
};

function UsersTableComponent({
  users,
  page,
  total,
  pageSize,
  onPageChange,
  isLoading = false,
  error,
  onUserDeleted,
  onUserUpdated,
  currentUserId,
   isAdmin = false,
}: UsersTableProps) {
  // Verifica se há usuários para exibir
  const hasUsers = users.length > 0;

  return (
    <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-background shadow-sm flex flex-col">
      {isLoading ? (
        <>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm table-auto">
              <thead className="bg-muted text-muted-foreground sticky top-0 z-30">
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-left font-semibold sticky left-0 z-20 bg-muted">
                    Nome
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">Email</th>
                  <th className="px-3 py-3 text-left font-semibold">Departamento</th>
                  <th className="px-3 py-3 text-left font-semibold">Entidade</th>
                  <th className="px-3 py-3 text-left font-semibold">Ativo</th>
                  <th className="px-3 py-3 text-left font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                <UserRowSkeleton rows={15} />
              </tbody>
            </table>
          </div>
          <Separator />
          <UsersPagination
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </>
      ) : error ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <div className="text-sm text-muted-foreground">{error}</div>
        </div>
      ) : !hasUsers ? (
        // Estado vazio - nenhum usuário encontrado
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
          <div className="w-full max-w-xs text-muted-foreground">
            <NotFoundUFO />
          </div>
          <div className="text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </div>
        </div>
      ) : (
        // Tabela com lista de usuários
        <>
          {/* Container com scroll da tabela */}
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm table-auto">
              {/* Cabeçalho da tabela (sticky) */}
              <thead className="bg-muted text-muted-foreground sticky top-0 z-30">
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-left font-semibold sticky left-0 z-20 bg-muted">
                    Nome
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">Email</th>
                  <th className="px-3 py-3 text-left font-semibold">Departamento</th>
                  <th className="px-3 py-3 text-left font-semibold">Entidade</th>
                  <th className="px-3 py-3 text-left font-semibold">Ativo</th>
                  <th className="px-3 py-3 text-left font-semibold">Ações</th>
                </tr>
              </thead>

              {/* Corpo da tabela - linhas de usuários */}
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onDeleted={onUserDeleted}
                    onUpdated={onUserUpdated}
                    isCurrentUser={user.id === currentUserId}
                    isAdmin={isAdmin}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Separador visual */}
          <Separator />

          {/* Paginação no footer */}
          <UsersPagination
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  );
}

// Memoiza para evitar re-renders desnecessários
// Só re-renderiza quando users, page, totalPages ou onPageChange mudam
export const UsersTable = memo(UsersTableComponent);

