import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type {
  CreateSchoolInput,
  SchoolCardRow,
  SchoolClassListItem,
  SchoolListItem,
  SchoolTeacherListItem,
  UpdateSchoolInput,
} from "../types";

let schoolsCache: SchoolListItem[] | null = null;
let classesCache: SchoolClassListItem[] | null = null;
let teachersCache: SchoolTeacherListItem[] | null = null;

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function buildAbbreviation(name: string): string {
  const normalized = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (normalized.length === 0) return "ESC";
  if (normalized.length === 1) return normalized[0].slice(0, 3).toUpperCase();

  return normalized
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function useSchools() {
  const [search, setSearch] = useState("");
  const [schools, setSchools] = useState<SchoolListItem[]>([]);
  const [classes, setClasses] = useState<SchoolClassListItem[]>([]);
  const [teachers, setTeachers] = useState<SchoolTeacherListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      if (schoolsCache && classesCache && teachersCache) {
        setSchools(schoolsCache);
        setClasses(classesCache);
        setTeachers(teachersCache);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [schoolsData, classesData, teachersData] = await Promise.all([
          api.get<SchoolListItem[]>("/schools"),
          api.get<SchoolClassListItem[]>("/classes"),
          api.get<SchoolTeacherListItem[]>("/teachers"),
        ]);

        if (!isActive) return;

        schoolsCache = schoolsData ?? [];
        classesCache = classesData ?? [];
        teachersCache = teachersData ?? [];

        setSchools(schoolsCache);
        setClasses(classesCache);
        setTeachers(teachersCache);
      } catch (err) {
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Erro ao carregar escolas";
        setError(message);
        setSchools([]);
        setClasses([]);
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

  const createSchool = useCallback(
    async (input: CreateSchoolInput) => {
      const { data: createdSchool } = await api.postWithMeta<SchoolListItem>("/schools", input);

      schoolsCache = [...(schoolsCache ?? schools), createdSchool]
        .filter((school, index, array) => array.findIndex((item) => item.id === school.id) === index)
        .sort((a, b) => a.name.localeCompare(b.name));

      setSchools(schoolsCache);
      setError(null);

      return createdSchool;
    },
    [schools]
  );

  const deleteSchool = useCallback(async (schoolId: string) => {
    await api.delete<void>(`/schools/${schoolId}`);

    schoolsCache = (schoolsCache ?? schools).filter((school) => school.id !== schoolId);
    classesCache = (classesCache ?? classes).filter((item) => item.school_id !== schoolId);
    teachersCache = (teachersCache ?? teachers).filter((item) => item.school_id !== schoolId);

    setSchools(schoolsCache);
    setClasses(classesCache);
    setTeachers(teachersCache);
    setError(null);
  }, [classes, schools, teachers]);

  const updateSchool = useCallback(async (schoolId: string, input: UpdateSchoolInput) => {
    const { data: updatedSchool } = await api.patchWithMeta<SchoolListItem>(`/schools/${schoolId}`, input);

    schoolsCache = (schoolsCache ?? schools)
      .map((school) => (school.id === schoolId ? updatedSchool : school))
      .sort((a, b) => a.name.localeCompare(b.name));

    setSchools(schoolsCache);
    setError(null);

    return updatedSchool;
  }, [schools]);

  const classCountBySchool = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of classes) {
      map.set(item.school_id, (map.get(item.school_id) ?? 0) + 1);
    }
    return map;
  }, [classes]);

  const teacherCountBySchool = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of teachers) {
      map.set(item.school_id, (map.get(item.school_id) ?? 0) + 1);
    }
    return map;
  }, [teachers]);

  const mappedSchools = useMemo<SchoolCardRow[]>(() => {
    return schools
      .filter((school) => school.active !== false)
      .map((school) => ({
        id: school.id,
        abbreviation:
          school.abbreviation && school.abbreviation.trim().length > 0
            ? school.abbreviation.trim().toUpperCase()
            : buildAbbreviation(school.name),
        name: school.name,
        classCount: classCountBySchool.get(school.id) ?? 0,
        teacherCount: teacherCountBySchool.get(school.id) ?? 0,
        active: school.active !== false,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classCountBySchool, schools, teacherCountBySchool]);

  const filteredSchools = useMemo(() => {
    const query = search.trim().toLowerCase();
    const normalizedQuery = normalizeSearchText(search.trim());
    const hasNormalizedQuery = normalizedQuery.length > 0;

    if (!query) return mappedSchools;

    return mappedSchools.filter((item) => {
      const normalizedName = normalizeSearchText(item.name);
      const normalizedAbbreviation = normalizeSearchText(item.abbreviation);
      return (
        item.name.toLowerCase().includes(query) ||
        item.abbreviation.toLowerCase().includes(query) ||
        (hasNormalizedQuery && normalizedName.includes(normalizedQuery)) ||
        (hasNormalizedQuery && normalizedAbbreviation.includes(normalizedQuery))
      );
    });
  }, [mappedSchools, search]);

  const total = filteredSchools.length;

  return {
    search,
    setSearch,
    schools: filteredSchools,
    createSchool,
    deleteSchool,
    updateSchool,
    total,
    isLoading,
    error,
  };
}
