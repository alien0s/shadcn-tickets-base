import { useCallback, useEffect, useMemo, useState } from "react";
import { mockUsers } from "../data/mockUsers";

// Hook customizado para gerenciar estado e lógica da lista de usuários
// TODO: Integrar com API real - substituir mockUsers por chamadas HTTP
export function useUsers() {
  // Estados principais
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Configuração de paginação
  const pageSize = 20;

  // TODO: Substituir por chamada de API
  // const { data: users, isLoading } = useQuery(['users'], fetchUsers);
  const users = mockUsers;

  // Extrai lista única de entidades disponíveis (memoizado)
  const entities = useMemo(() => {
    return Array.from(new Set(users.map((user) => user.entity)));
  }, [users]);

  // Extrai lista única de funções/cargos disponíveis (memoizado)
  const roles = useMemo(() => {
    return Array.from(new Set(users.map((user) => user.role)));
  }, [users]);

  // Handler para adicionar/remover entidade dos filtros
  const toggleEntity = useCallback((entity: string) => {
    setSelectedEntities((prev) =>
      prev.includes(entity)
        ? prev.filter((item) => item !== entity)
        : [...prev, entity]
    );
  }, []);

  // Handler para adicionar/remover função dos filtros
  const toggleRole = useCallback((role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((item) => item !== role)
        : [...prev, role]
    );
  }, []);

  // Aplica filtros de busca, entidades e funções (memoizado)
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = users;

    // Filtra por busca (nome ou email)
    if (query) {
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    // Filtra por entidades selecionadas
    if (selectedEntities.length > 0) {
      result = result.filter((user) =>
        selectedEntities.includes(user.entity)
      );
    }

    // Filtra por funções selecionadas
    if (selectedRoles.length > 0) {
      result = result.filter((user) => selectedRoles.includes(user.role));
    }

    return result;
  }, [search, selectedEntities, selectedRoles, users]);

  // Calcula total de páginas baseado nos usuários filtrados
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  // Garante que a página atual não exceda o total de páginas
  const currentPage = Math.min(page, totalPages);

  // Aplica paginação aos usuários filtrados (memoizado)
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [currentPage, filteredUsers, pageSize]);

  // Reseta para página 1 quando filtros mudam
  useEffect(() => {
    setPage(1);
  }, [search, selectedEntities, selectedRoles]);

  // Ajusta página se exceder o total de páginas após filtros
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // TODO: Quando integrar com API, adicionar estados de loading e error:
  // return {
  //   ...rest,
  //   isLoading,
  //   error,
  //   refetch,
  // }

  return {
    // Estado de busca
    search,
    setSearch,

    // Dados de usuários
    users, // Lista completa (não filtrada)
    filteredUsers, // Após aplicar filtros
    paginatedUsers, // Página atual

    // Paginação
    page: currentPage,
    totalPages,
    setPage,

    // Filtros disponíveis
    entities,
    roles,

    // Filtros selecionados
    selectedEntities,
    selectedRoles,

    // Handlers de filtros
    toggleEntity,
    toggleRole,
  };
}