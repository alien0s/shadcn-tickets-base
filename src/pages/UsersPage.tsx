import { SidebarProvider, useSidebar } from "@/context/sidebar-context";
import { Sidebar } from "@/layout/Sidebar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PanelRight, Pencil, ListFilter, Search, Trash, UserPlus } from "lucide-react";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  entity: string;
  avatar?: string;
};

const MOCK_USERS: UserRecord[] = [
  { id: "1", name: "Florence Shaw", email: "florence@untitledui.com", entity: "ANRA", avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU6TAn8zOX5VYek6Hq0ToTCdAbi0cyjHVQ8g&s" },
  { id: "2", name: "Amelie Laurent", email: "amelie@untitledui.com", entity: "ACeAm", avatar: "https://i.pinimg.com/736x/27/57/78/2757784d2e6f5d047987321cf8d5bb89.jpg" },
  { id: "3", name: "Ammar Foley", email: "ammar@untitledui.com", entity: "Asur", avatar: "https://64.media.tumblr.com/2958d96eff5c2fc0b4086c21982d23f5/8c516146086d2073-e9/s400x600/d426c64fe22bedc432adcc434512f4f2e83cf11a.png" },
  { id: "4", name: "Caitlyn King", email: "caitlyn@untitledui.com", entity: "MLA", avatar: "https://64.media.tumblr.com/85fbc70fa1a3feee7c8d101b016951a8/tumblr_plorzglJM01t8o0f1_640.jpg" },
  { id: "5", name: "Sienna Hewitt", email: "sienna@untitledui.com", entity: "UNoB", avatar: "https://64.media.tumblr.com/f96a783d595a44f728cf16d9c8cd92de/91943817594ce704-63/s1280x1920/fc8ac934dc7e234c80468204792ed713de3668ff.jpg" },
  { id: "6", name: "Olly Shroeder", email: "olly@untitledui.com", entity: "ANRA", avatar: "https://64.media.tumblr.com/828af31d21d56bbdd550145c06a996e2/f0f32dc6e6f1ae3a-e1/s400x600/e211852a1bdc89b24818163d1813d5eb1979cf04.png" },
  { id: "7", name: "Mathilde Lewis", email: "mathilde@untitledui.com", entity: "ACeAm", avatar: "https://64.media.tumblr.com/8709f271cbd317565e943ceb71392927/e5dbbf3d086bbd56-65/s400x600/58a0514133123c386aa27667d0d62aec46bcbc0b.png" },
  { id: "8", name: "Jaya Willis", email: "jaya@untitledui.com", entity: "Asur", avatar: "https://64.media.tumblr.com/1e4044a7cca8c148e0000844d9dbc2d2/070eeef01370ec67-4a/s540x810/b253278aee94cd594f146a6be22e3dfdcf24d0c4.jpg" },
];

export function UsersPage() {
  return (
    <SidebarProvider>
      <div className="min-h-[var(--app-height)] w-full bg-background text-foreground flex">
        <Sidebar />
        <UsersShell />
      </div>
    </SidebarProvider>
  );
}

function UsersShell() {
  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 pt-3 pb-5 sm:px-5 lg:px-8">
          <UsersTable />
        </div>
      </div>
    </main>
  );
}

function UsersTable() {
  const { toggleSidebar } = useSidebar();
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="md:hidden" onClick={toggleSidebar}>
              <PanelRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold leading-tight">Usuarios</h1>
              <span className="text-sm text-muted-foreground">{MOCK_USERS.length}</span>
            </div>
          </div>

        <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
          <div className="relative w-[200px]">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <Input
              placeholder="Search"
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ListFilter className="h-4 w-4" />
            Filtros
          </Button>
          <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Criar usuario
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ListFilter className="h-4 w-4" />
              Filtros
            </Button>
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Criar usuario
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <div className="relative w-full">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <Input
              placeholder="Search"
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-background shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-3 py-3 text-left font-semibold">Nome</th>
                <th className="px-3 py-3 text-left font-semibold">Email</th>
                <th className="px-3 py-3 text-left font-semibold">Funcao</th>
                <th className="px-3 py-3 text-left font-semibold">Entidade</th>
                <th className="px-3 py-3 text-left font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name} />
                        ) : (
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground truncate">{user.email}</td>
                  <td className="px-3 py-3 text-muted-foreground">Admin</td>
                  <td className="px-3 py-3 text-muted-foreground">{user.entity}</td>
                  <td className="px-3 py-3">
                    <div className="flex justify-start gap-2 whitespace-nowrap">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-red-600 hover:text-red-700"
                      >
                        <Trash className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Separator />
        <div className="flex items-center justify-end px-4 py-3 text-xs text-muted-foreground gap-2">
          <Button variant="outline" size="sm">
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function getInitials(name: string) {
  const [first = "", second = ""] = name.split(" ");
  return `${first[0] || ""}${second[0] || ""}`.toUpperCase();
}
