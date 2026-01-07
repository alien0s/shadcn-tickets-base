import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import type { UserRecord } from "../data/mockUsers";
import { getInitials } from "../utils/getInitials";

type UserRowProps = {
  user: UserRecord;
};

export function UserRow({ user }: UserRowProps) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-3 py-3 sticky left-0 z-10 bg-background">
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
      <td className="px-3 py-3 text-muted-foreground truncate">
        {user.email}
      </td>
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
  );
}
