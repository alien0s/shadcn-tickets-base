import { Separator } from "@/components/ui/separator";
import { NotFoundUFO } from "@/components/illustrations/NotFoundUFO";
import type { UserRecord } from "../data/mockUsers";
import { UserRow } from "./UserRow";
import { UsersPagination } from "./UsersPagination";

type UsersTableProps = {
  users: UserRecord[];
};

export function UsersTable({ users }: UsersTableProps) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-border bg-background shadow-sm flex flex-col">
      {users.length === 0 ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
          <div className="w-full max-w-xs text-muted-foreground">
            <NotFoundUFO />
          </div>
          <div className="text-sm text-muted-foreground">
            Nenhum usuário encontrado.
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm table-auto">
              <thead className="bg-muted text-muted-foreground sticky top-0 z-30">
                <tr className="border-b border-border">
                  <th className="px-3 py-3 text-left font-semibold sticky left-0 z-20 bg-muted">
                    Nome
                  </th>
                  <th className="px-3 py-3 text-left font-semibold">Email</th>
                  <th className="px-3 py-3 text-left font-semibold">Funcao</th>
                  <th className="px-3 py-3 text-left font-semibold">Entidade</th>
                  <th className="px-3 py-3 text-left font-semibold">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
          <Separator />
          <UsersPagination />
        </>
      )}
    </div>
  );
}
