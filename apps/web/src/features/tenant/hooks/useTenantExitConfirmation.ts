import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth";
import { api } from "@/lib/api";

type TenantExitUser = {
  id: string;
  entity_id?: string;
};

export function useTenantExitConfirmation() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasOtherUsers, setHasOtherUsers] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadUsers = async () => {
      if (!user?.id) {
        setHasOtherUsers(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data, pagination } = await api.getWithMeta<TenantExitUser[]>(
          "/users?page=1&limit=100&sortBy=created_at&order=desc"
        );

        if (!isActive) return;

        const scopedUsers = (data ?? []).filter((item) => item.id !== user.id && item.entity_id === user.entity_id);
        const hasScopedUsers = scopedUsers.length > 0;
        const hasPaginatedFallback = typeof pagination?.total === "number" ? pagination.total > 1 : false;

        setHasOtherUsers(hasScopedUsers || hasPaginatedFallback);
      } catch {
        if (!isActive) return;
        setHasOtherUsers(false);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      isActive = false;
    };
  }, [user?.entity_id, user?.id]);

  const openDialog = useCallback(() => setIsOpen(true), []);
  const handleOpenChange = useCallback((open: boolean) => setIsOpen(open), []);
  const handleConfirmExit = useCallback(() => {
    if (!hasOtherUsers) return;
    logout();
  }, [hasOtherUsers, logout]);

  const description = useMemo(() => {
    if (isLoading) {
      return "Estamos verificando se existe outro usuario vinculado a esta empresa antes de permitir a sua saida.";
    }

    if (!hasOtherUsers) {
      return "Voce nao pode sair desta empresa agora, porque nao encontramos outro usuario vinculado a ela. Cadastre ou mantenha outro usuario responsavel antes de continuar.";
    }

    return "Ao sair desta empresa, voce perdera o acesso a este ambiente com o seu perfil atual. Confirme apenas se voce tem certeza do que esta fazendo e se outro usuario seguira responsavel por esta empresa.";
  }, [hasOtherUsers, isLoading]);

  return {
    isOpen,
    isLoading,
    hasOtherUsers,
    description,
    openDialog,
    handleOpenChange,
    handleConfirmExit,
  };
}
