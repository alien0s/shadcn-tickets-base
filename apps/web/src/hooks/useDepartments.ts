import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type DepartmentOption = {
  id: string;
  name: string;
};

let departmentsCache: DepartmentOption[] | null = null;

/**
 * Shared hook to fetch and cache departments data.
 * Prevents duplicate API calls across components.
 */
export function useDepartments() {
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDepartments = useCallback(async () => {
    // Se já tem cache, usa
    if (departmentsCache) {
      setDepartments(departmentsCache)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await api.get<DepartmentOption[]>("/departments")
      departmentsCache = data || []
      setDepartments(departmentsCache)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar departamentos"
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const refetch = useCallback(() => {
    departmentsCache = null
    return fetchDepartments()
  }, [fetchDepartments])

  return { departments, isLoading, error, refetch }
}
