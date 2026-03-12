import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { TeacherRow } from "../components/TeachersTable";

type TeacherApi = {
  id: string;
  school_id: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  active: boolean;
  created_at: string;
  subjects?: Array<{ id: string; name: string }>;
};

type SchoolApi = {
  id: string;
  name: string;
};

type SubjectApi = {
  id: string;
  name: string;
};

const teachersCache = new Map<string, TeacherApi[]>();
let schoolsCache: SchoolApi[] | null = null;
let subjectsCache: SubjectApi[] | null = null;

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function useTeachers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [teachers, setTeachers] = useState<TeacherApi[]>([]);
  const [schools, setSchools] = useState<SchoolApi[]>([]);
  const [subjects, setSubjects] = useState<SubjectApi[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 20;

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      const cacheKey = "teachers:list";
      const cachedTeachers = teachersCache.get(cacheKey);

      if (cachedTeachers && schoolsCache && subjectsCache) {
        setTeachers(cachedTeachers);
        setSchools(schoolsCache);
        setSubjects(subjectsCache);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [teachersData, schoolsData, subjectsData] = await Promise.all([
          api.get<TeacherApi[]>("/teachers"),
          api.get<SchoolApi[]>("/schools"),
          api.get<SubjectApi[]>("/subjects"),
        ]);

        if (!isActive) return;
        const nextTeachers = teachersData ?? [];
        teachersCache.set(cacheKey, nextTeachers);
        schoolsCache = schoolsData ?? [];
        subjectsCache = subjectsData ?? [];
        setTeachers(nextTeachers);
        setSchools(schoolsCache);
        setSubjects(subjectsCache);
      } catch (err) {
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Erro ao carregar professores";
        setError(message);
        setTeachers([]);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, []);

  const schoolMap = useMemo(() => {
    return new Map(schools.map((item) => [item.id, item.name]));
  }, [schools]);

  const mappedTeachers = useMemo<TeacherRow[]>(() => {
    return teachers.map((item) => ({
      id: item.id,
      schoolId: item.school_id,
      name: item.name,
      email: item.email ?? "",
      schoolName: schoolMap.get(item.school_id) ?? "-",
      avatarUrl: item.avatar_url ?? null,
      active: item.active,
      subjects: (item.subjects ?? []).map((subject) => ({
        id: subject.id,
        name: subject.name,
      })),
    }));
  }, [teachers, schoolMap]);

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const normalizedQuery = normalizeSearchText(search.trim());
    const hasNormalizedQuery = normalizedQuery.length > 0;

    let result = mappedTeachers;
    if (selectedSchoolId !== "all") {
      result = result.filter((item) => item.schoolId === selectedSchoolId);
    }

    if (!query) return result;

    return result.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      (hasNormalizedQuery && normalizeSearchText(item.name).includes(normalizedQuery)) ||
      item.email.toLowerCase().includes(query) ||
      (hasNormalizedQuery && normalizeSearchText(item.email).includes(normalizedQuery)) ||
      item.schoolName.toLowerCase().includes(query) ||
      (hasNormalizedQuery && normalizeSearchText(item.schoolName).includes(normalizedQuery))
    );
  }, [mappedTeachers, search, selectedSchoolId]);

  const total = filteredTeachers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedSchoolId]);

  const schoolOptions = useMemo(
    () =>
      schools
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((school) => ({
          id: school.id,
          name: school.name,
        })),
    [schools]
  );

  const subjectOptions = useMemo(
    () =>
      subjects
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((subject) => ({
          id: subject.id,
          name: subject.name,
        })),
    [subjects]
  );

  const paginatedTeachers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTeachers.slice(start, start + pageSize);
  }, [filteredTeachers, page, pageSize]);

  const updateTeacherInList = (updatedTeacher: Omit<TeacherApi, "created_at"> & { created_at?: string }) => {
    const cacheKey = "teachers:list";
    setTeachers((previous) => {
      const next = previous.map((item) =>
        item.id === updatedTeacher.id
          ? {
              ...item,
              ...updatedTeacher,
              created_at: updatedTeacher.created_at ?? item.created_at,
            }
          : item
      );
      teachersCache.set(cacheKey, next);
      return next;
    });
  };

  const upsertTeacherInList = (teacher: Omit<TeacherApi, "created_at"> & { created_at?: string }) => {
    const cacheKey = "teachers:list";
    setTeachers((previous) => {
      const existingIndex = previous.findIndex((item) => item.id === teacher.id);
      let next: TeacherApi[];

      if (existingIndex >= 0) {
        next = previous.map((item) =>
          item.id === teacher.id
            ? {
                ...item,
                ...teacher,
                created_at: teacher.created_at ?? item.created_at,
              }
            : item
        );
      } else {
        next = [
          ...previous,
          {
            id: teacher.id,
            school_id: teacher.school_id,
            name: teacher.name,
            email: teacher.email ?? null,
            avatar_url: teacher.avatar_url ?? null,
            active: teacher.active,
            created_at: teacher.created_at ?? new Date().toISOString(),
            subjects: teacher.subjects ?? [],
          },
        ];
      }

      next.sort((a, b) => a.name.localeCompare(b.name));
      teachersCache.set(cacheKey, next);
      return next;
    });
  };

  const removeTeacherFromList = (teacherId: string) => {
    const cacheKey = "teachers:list";
    setTeachers((previous) => {
      const next = previous.filter((item) => item.id !== teacherId);
      teachersCache.set(cacheKey, next);
      return next;
    });
  };

  return {
    search,
    setSearch,
    teachers: paginatedTeachers,
    total,
    selectedSchoolId,
    setSelectedSchoolId,
    schoolOptions,
    subjectOptions,
    page,
    pageSize,
    setPage,
    isLoading,
    error,
    updateTeacherInList,
    upsertTeacherInList,
    removeTeacherFromList,
  };
}
