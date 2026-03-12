import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { SchoolCardRow } from "../components/SchoolsGrid";

type SchoolApi = {
  id: string;
  name: string;
  abbreviation?: string | null;
  active?: boolean;
};

type ClassApi = {
  id: string;
  school_id: string;
};

type TeacherApi = {
  id: string;
  school_id: string;
};

let schoolsCache: SchoolApi[] | null = null;
let classesCache: ClassApi[] | null = null;
let teachersCache: TeacherApi[] | null = null;

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
  const [schools, setSchools] = useState<SchoolApi[]>([]);
  const [classes, setClasses] = useState<ClassApi[]>([]);
  const [teachers, setTeachers] = useState<TeacherApi[]>([]);
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
          api.get<SchoolApi[]>("/schools"),
          api.get<ClassApi[]>("/classes"),
          api.get<TeacherApi[]>("/teachers"),
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
    total,
    isLoading,
    error,
  };
}
