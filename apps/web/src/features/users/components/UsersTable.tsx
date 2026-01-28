import { memo } from "react";
import { Separator } from "@/components/ui/separator";
import { NotFoundUFO } from "@/components/illustrations/NotFoundUFO";
import type { UserRecord } from "../data/mockUsers";
import { UserRow } from "./UserRow";
import { UsersPagination } from "./UsersPagination";

type UsersTableProps = {
  users: UserRecord[];
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
};

function UsersTableComponent({
  users,
  page,
  totalPages,
  onPageChange,
}: UsersTableProps) {
  // Verifica se há usuários para exibir
  const hasUsers = users.length > 0;

  return (
    <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-background shadow-sm flex flex-col">
      {!hasUsers ? (
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
                  <th className="px-3 py-3 text-left font-semibold">Função</th>
                  <th className="px-3 py-3 text-left font-semibold">Entidade</th>
                  <th className="px-3 py-3 text-left font-semibold">Ações</th>
                </tr>
              </thead>

              {/* Corpo da tabela - linhas de usuários */}
              <tbody>
                {users.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Separador visual */}
          <Separator />

          {/* Paginação no footer */}
          <UsersPagination
            page={page}
            totalPages={totalPages}
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