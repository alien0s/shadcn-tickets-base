import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { UserRecord } from "../data/mockUsers";
import { useDepartments } from "@/hooks/useDepartments";
import { useEntities } from "@/hooks/useEntities";

type ApiUser = {
  id: string;
  name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  is_active?: boolean;
  department_id: string;
  role_id: string;
  entity_id: string;
  created_at: string;
};

const usersCache = new Map<number, { data: ApiUser[]; total: number }>();

// Hook customizado para gerenciar estado e lógica da lista de usuários
export function useUsers() {
  // Estados principais
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Dados
  const [users, setUsers] = useState<ApiUser[]>(
    () => usersCache.get(1)?.data ?? []
  );
  const [total, setTotal] = useState(() => usersCache.get(1)?.total ?? 0);
  const {
    departments,
    isLoading: isLoadingDepartments,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useDepartments();
  const {
    entities,
    isLoading: isLoadingEntities,
    error: entitiesError,
    refetch: refetchEntities,
  } = useEntities();

  // Estados de carregamento e erro
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Configuração de paginação
  const pageSize = 20;

  /**
   * Refresh completo - limpa cache e recarrega tudo
   * Use apenas quando necessário (ex: após criar novo usuário)
   */
  const refresh = useCallback(() => {
    usersCache.clear();
    setPage(1);
    setReloadKey((prev) => prev + 1);
    refetchDepartments();
    refetchEntities();
  }, [refetchDepartments, refetchEntities]);

  /**
   * Remove usuário da lista local e do cache (atualização otimista)
   * Evita reload completo da página
   */
  const removeUser = useCallback((userId: string) => {
    setUsers((currentUsers) => {
      const updated = currentUsers.filter((u) => u.id !== userId);
      
      // Atualizar cache da página atual
      const currentCache = usersCache.get(page);
      if (currentCache) {
        usersCache.set(page, {
          data: updated,
          total: currentCache.total - 1,
        });
      }
      
      return updated;
    });

    // Atualizar total geral
    setTotal((currentTotal) => Math.max(0, currentTotal - 1));
  }, [page]);

  /**
   * Atualiza usuário na lista local e no cache (atualização otimista)
   * Evita reload completo da página
   */
  const updateUser = useCallback((userId: string, updatedData: Partial<ApiUser>) => {
    setUsers((currentUsers) => {
      const updated = currentUsers.map((u) =>
        u.id === userId ? { ...u, ...updatedData } : u
      );
      
      // Atualizar cache da página atual
      const currentCache = usersCache.get(page);
      if (currentCache) {
        usersCache.set(page, {
          data: updated,
          total: currentCache.total,
        });
      }
      
      return updated;
    });
  }, [page]);

  /**
   * Adiciona usuário na lista local e no cache (atualização otimista)
   * Evita reload completo da página
   */
  const addUser = useCallback((newUser: ApiUser) => {
    const currentCache = usersCache.get(page);
    const nextTotal = (currentCache?.total ?? total) + 1;

    setTotal(nextTotal);

    setUsers((currentUsers) => {
      if (page !== 1) {
        return currentUsers;
      }

      const nextUsers = [newUser, ...currentUsers].slice(0, pageSize);
      usersCache.set(1, { data: nextUsers, total: nextTotal });
      return nextUsers;
    });

    if (currentCache && page !== 1) {
      usersCache.set(page, { data: currentCache.data, total: nextTotal });
    }
  }, [page, pageSize, total]);

  /**
   * Carrega usuários da API com cache por página
   */
  useEffect(() => {
    let isActive = true;

    const loadUsers = async () => {
      // Verificar cache PRIMEIRO - se existir, usa e não faz requisição
      const cached = usersCache.get(page);
      if (cached) {
        setUsers(cached.data);
        setTotal(cached.total);
        setIsLoadingUsers(false);
        return; // ← Para aqui, não faz requisição!
      }

      // Se não tem cache, busca da API
      setIsLoadingUsers(true);
      setError(null);
      
      try {
        const { data, pagination } = await api.getWithMeta<ApiUser[]>(
          `/users?page=${page}&limit=${pageSize}&sortBy=name&order=asc`
        );

        if (!isActive) return;
        
        const nextUsers = data || [];
        const nextTotal = pagination?.total ?? 0;
        
        // Salva no cache
        usersCache.set(page, { data: nextUsers, total: nextTotal });
        setUsers(nextUsers);
        setTotal(nextTotal);
      } catch (err) {
        if (!isActive) return;
        const message =
          err instanceof Error ? err.message : "Erro ao carregar usuários";
        setError(message);
      } finally {
        if (isActive) setIsLoadingUsers(false);
      }
    };

    loadUsers();

    return () => {
      isActive = false;
    };
  }, [page, reloadKey]);

  /**
   * Cria mapa de departamentos para lookup rápido (O(1))
   */
  const departmentMap = useMemo(() => {
    return new Map(departments.map((item) => [item.id, item.name]));
  }, [departments]);

  /**
   * Cria mapa de entidades para lookup rápido (O(1))
   */
  const entityMap = useMemo(() => {
    return new Map(entities.map((item) => [item.id, item.name]));
  }, [entities]);

  /**
   * Mapeia usuários da API para formato da UI
   * Combina name + last_name e resolve department/entity names
   */
  const mappedUsers = useMemo<UserRecord[]>(() => {
    return users.map((user) => {
      const departmentName = departmentMap.get(user.department_id) || "-";
      const entityName = entityMap.get(user.entity_id) || "-";
      const nameParts = [user.name, user.last_name]
        .map((value) => (value ?? "").toString().trim())
        .filter(Boolean);
      const fullName = nameParts.join(" ");

      return {
        id: user.id,
        name: fullName,
        email: user.email,
        role: departmentName,
        entity: entityName,
        avatar: user.avatar_url,
        role_id: user.role_id,
        is_active: user.is_active ?? false,
      };
    });
  }, [departmentMap, entityMap, users]);

  /**
   * Extrai lista única de entidades disponíveis (memoizado)
   */
  const entitiesList = useMemo(() => {
    return entities.map((entity) => entity.name);
  }, [entities]);

  /**
   * Extrai lista única de funções/cargos disponíveis (memoizado)
   */
  const rolesList = useMemo(() => {
    return departments.map((department) => department.name);
  }, [departments]);

  /**
   * Handler para adicionar/remover entidade dos filtros
   */
  const toggleEntity = useCallback((entity: string) => {
    setSelectedEntities((prev) =>
      prev.includes(entity)
        ? prev.filter((item) => item !== entity)
        : [...prev, entity]
    );
  }, []);

  /**
   * Handler para adicionar/remover função dos filtros
   */
  const toggleRole = useCallback((role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((item) => item !== role)
        : [...prev, role]
    );
  }, []);

  /**
   * Aplica filtros de busca, entidades e funções (memoizado)
   * Filtra apenas no client-side para melhor UX
   */
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    let result = mappedUsers;

    if (query) {
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
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
  }, [mappedUsers, search, selectedEntities, selectedRoles]);

  /**
   * Calcula total de páginas baseado no total de registros
   */
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /**
   * Ajusta página atual se exceder o total
   */
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  /**
   * Reseta para primeira página ao aplicar filtros
   */
  useEffect(() => {
    setPage(1);
  }, [search, selectedEntities, selectedRoles]);

  /**
   * Combina erros de diferentes fontes
   */
  const combinedError = error ?? departmentsError ?? entitiesError;
  
  /**
   * Combina estados de loading
   */
  const isLoading = isLoadingUsers || isLoadingDepartments || isLoadingEntities;

  return {
    // Estado de busca
    search,
    setSearch,

    // Dados de usuários
    users: mappedUsers,
    filteredUsers,

    // Paginação
    page,
    total,
    pageSize,
    totalPages,
    setPage,

    // Filtros disponíveis
    entities: entitiesList,
    roles: rolesList,

    // Filtros selecionados
    selectedEntities,
    selectedRoles,

    // Handlers de filtros
    toggleEntity,
    toggleRole,

    // Estado de carregamento e erro
    isLoading,
    error: combinedError,

    // Funções de atualização
    refresh, // ← Usar apenas ao criar novo usuário
    removeUser, // ← Usar ao excluir usuário (atualização otimista)
    updateUser, // ← Usar ao editar usuário (atualização otimista)
    addUser, // ← Usar ao criar usuário (atualização otimista)
  };
}
