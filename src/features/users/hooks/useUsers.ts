import { useMemo, useState } from "react";
import { mockUsers } from "../data/mockUsers";

export function useUsers() {
  const [search, setSearch] = useState("");
  const users = mockUsers;

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => user.name.toLowerCase().includes(query));
  }, [search, users]);

  return {
    search,
    setSearch,
    users,
    filteredUsers,
  };
}
