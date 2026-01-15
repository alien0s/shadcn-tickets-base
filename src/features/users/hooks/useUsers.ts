import { useEffect, useMemo, useState } from "react";
import { mockUsers } from "../data/mockUsers";

export function useUsers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const users = mockUsers;

  const entities = useMemo(() => {
    return Array.from(new Set(users.map((user) => user.entity)));
  }, [users]);

  const roles = useMemo(() => {
    return Array.from(new Set(users.map((user) => user.role)));
  }, [users]);

  const toggleEntity = (entity: string) => {
    setSelectedEntities((prev) =>
      prev.includes(entity)
        ? prev.filter((item) => item !== entity)
        : [...prev, entity]
    );
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((item) => item !== role)
        : [...prev, role]
    );
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = users;
    if (query) {
      result = result.filter((user) =>
        user.name.toLowerCase().includes(query)
      );
    }
    if (selectedEntities.length > 0) {
      result = result.filter((user) =>
        selectedEntities.includes(user.entity)
      );
    }
    if (selectedRoles.length > 0) {
      result = result.filter((user) => selectedRoles.includes(user.role));
    }
    return result;
  }, [search, selectedEntities, selectedRoles, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [currentPage, filteredUsers, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedEntities, selectedRoles]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return {
    search,
    setSearch,
    users,
    filteredUsers,
    paginatedUsers,
    page: currentPage,
    totalPages,
    setPage,
    entities,
    roles,
    selectedEntities,
    selectedRoles,
    toggleEntity,
    toggleRole,
  };
}
