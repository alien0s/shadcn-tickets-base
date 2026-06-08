import { useCallback, useEffect, useState } from "react";
import type { CreateSubjectRequest } from "@ticket-system/types";
import { api } from "@/lib/api";
import { markSubjectsCatalogUpdated } from "@/utils/subjects-catalog";

type SubjectApi = {
  id: string;
  name: string;
  icon?: string | null;
  created_at: string;
};

type CreateSubjectPayload = CreateSubjectRequest;

type UpdateSubjectPayload = {
  name: string;
  icon: string;
};

let subjectsCache: SubjectApi[] | null = null;

export function useSubjects() {
  const [subjects, setSubjects] = useState<SubjectApi[]>(() => subjectsCache ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subjectsCache) {
      setSubjects(subjectsCache);
      return;
    }

    let isActive = true;

    const loadSubjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await api.get<SubjectApi[]>("/subjects");
        if (!isActive) return;

        const nextSubjects = (data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        subjectsCache = nextSubjects;
        setSubjects(nextSubjects);
      } catch (requestError) {
        if (!isActive) return;
        setSubjects([]);
        setError(
          requestError instanceof Error ? requestError.message : "Não foi possível carregar as matérias."
        );
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void loadSubjects();

    return () => {
      isActive = false;
    };
  }, []);

  const createSubject = useCallback(async (payload: CreateSubjectPayload) => {
    const created = await api.post<SubjectApi>("/subjects", {
      name: payload.name.trim(),
      icon: payload.icon?.trim() || null,
    });

    setSubjects((current) => {
      const nextSubjects = [...current, created].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      subjectsCache = nextSubjects;
      return nextSubjects;
    });
    markSubjectsCatalogUpdated();

    return created;
  }, []);

  const updateSubject = useCallback(async (subjectId: string, payload: UpdateSubjectPayload) => {
    const updated = await api.patch<SubjectApi>(`/subjects/${subjectId}`, {
      name: payload.name.trim(),
      icon: payload.icon.trim() || null,
    });

    setSubjects((current) => {
      const nextSubjects = current
        .map((subject) => (subject.id === subjectId ? updated : subject))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      subjectsCache = nextSubjects;
      return nextSubjects;
    });
    markSubjectsCatalogUpdated();

    return updated;
  }, []);

  return {
    subjects,
    total: subjects.length,
    isLoading,
    error,
    createSubject,
    updateSubject,
  };
}
