import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type EntityOption = {
  id: string;
  name: string;
};

let entitiesCache: EntityOption[] | null = null;

/**
 * Shared hook to fetch and cache entities data.
 * Prevents duplicate API calls across components.
 * @returns entities list, loading state, error state, and refetch function
 */
export function useEntities() {
  const [entities, setEntities] = useState<EntityOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntities = useCallback(async () => {
    // Se já tem cache, usa
    if (entitiesCache) {
      setEntities(entitiesCache)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await api.get<EntityOption[]>("/entities")
      entitiesCache = data || []
      setEntities(entitiesCache)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar entidades"
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEntities()
  }, [fetchEntities])

  const refetch = useCallback(() => {
    entitiesCache = null
    return fetchEntities()
  }, [fetchEntities])

  return { entities, isLoading, error, refetch }
}