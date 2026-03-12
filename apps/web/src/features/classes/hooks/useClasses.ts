import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { invalidateGradeClassesCache } from "@/features/grade/hooks/useGradeScheduleData";
import type { ClassRow } from "../components/ClassesTable";

type ClassApi = {
  id: string;
  school_id: string;
  shift?: number;
  education_level_id: string;
  series_id?: string;
  suffix?: string;
  series_name?: string;
  series_education_level_name?: string;
  education_level_name?: string;
  schedule_count?: number;
  name: string;
  code?: string;
  year: number;
  created_at: string;
  teachers?: Array<{
    id: string;
    name: string;
    avatar_url?: string | null;
  }>;
};

type SchoolApi = {
  id: string;
  name: string;
};

type EducationLevelApi = {
  id: string;
  name: string;
};

type SeriesApi = {
  id: string;
  education_level_id: string;
  name: string;
};

type CreateClassPayload = {
  school_id: string;
  series_id: string;
  suffix: string;
  shift: number;
  year: number;
};

const classesCache = new Map<string, ClassApi[]>();
let schoolsCache: SchoolApi[] | null = null;
let educationLevelsCache: EducationLevelApi[] | null = null;
let seriesCache: SeriesApi[] | null = null;

function formatDate(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function sortClasses(items: ClassApi[]): ClassApi[] {
  return items
    .slice()
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return a.name.localeCompare(b.name);
    });
}

function buildClassCode(seriesName: string | undefined, suffix: string | undefined, shift?: number): string {
  const cleanedSeries = String(seriesName ?? "")
    .replace(/\bano\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const normalizedSuffix = String(suffix ?? "").trim().toUpperCase();
  const shiftLetter = shift === 1 ? "M" : shift === 2 ? "V" : shift === 3 ? "N" : "";

  if (!cleanedSeries || !normalizedSuffix || !shiftLetter) return "";
  return `${cleanedSeries} ${normalizedSuffix}${shiftLetter}`.trim();
}

export function useClasses() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [classes, setClasses] = useState<ClassApi[]>([]);
  const [schools, setSchools] = useState<SchoolApi[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevelApi[]>([]);
  const [series, setSeries] = useState<SeriesApi[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const pageSize = 20;

  const refresh = useCallback(() => {
    classesCache.clear();
    schoolsCache = null;
    educationLevelsCache = null;
    seriesCache = null;
    setPage(1);
    setReloadKey((prev) => prev + 1);
  }, []);

  const createClass = useCallback(
    async (payload: CreateClassPayload) => {
      const created = await api.post<ClassApi>("/classes", payload);

      const sourceSeriesId = created.series_id ?? payload.series_id;
      const sourceSuffix = created.suffix ?? payload.suffix;
      const sourceShift = created.shift ?? payload.shift;
      const sourceSeries = series.find((item) => item.id === sourceSeriesId);
      const sourceLevel = educationLevels.find((level) => level.id === sourceSeries?.education_level_id);
      const fallbackName = [sourceSeries?.name, sourceSuffix].filter(Boolean).join(" ");
      const fallbackCode = buildClassCode(sourceSeries?.name, sourceSuffix, sourceShift);

      const normalizedCreated: ClassApi = {
        ...created,
        education_level_id: created.education_level_id ?? sourceSeries?.education_level_id ?? "",
        education_level_name: created.education_level_name ?? sourceLevel?.name,
        series_id: sourceSeriesId,
        suffix: sourceSuffix,
        shift: sourceShift,
        name: created.name ?? fallbackName,
        code: created.code || fallbackCode || sourceSuffix,
        teachers: created.teachers ?? [],
      };

      setClasses((previous) => {
        const next = sortClasses([normalizedCreated, ...previous]);
        classesCache.set("classes:list", next);
        return next;
      });

      invalidateGradeClassesCache(created.school_id);
    },
    [educationLevels, series]
  );

  const deleteClass = useCallback(async (classId: string) => {
    await api.delete<void>(`/classes/${classId}`);

    setClasses((previous) => {
      const target = previous.find((item) => item.id === classId);
      if (target?.school_id) {
        invalidateGradeClassesCache(target.school_id);
      }

      const next = previous.filter((item) => item.id !== classId);
      classesCache.set("classes:list", next);
      return next;
    });
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      const cacheKey = "classes:list";
      const cached = classesCache.get(cacheKey);
      const canHydrateFromCache =
        reloadKey === 0 && cached && schoolsCache && educationLevelsCache && seriesCache;

      if (canHydrateFromCache) {
        setClasses(cached);
        setSchools(schoolsCache ?? []);
        setEducationLevels(educationLevelsCache ?? []);
        setSeries(seriesCache ?? []);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [classesData, schoolsData, educationLevelsData] = await Promise.all([
          api.get<ClassApi[]>("/classes"),
          api.get<SchoolApi[]>("/schools"),
          api.get<EducationLevelApi[]>("/education-levels"),
        ]);

        let nextSeries: SeriesApi[] = [];
        try {
          nextSeries = (await api.get<SeriesApi[]>("/series")) ?? [];
        } catch {
          nextSeries = [];
        }

        if (!isActive) return;

        const nextClasses = classesData ?? [];
        classesCache.set(cacheKey, nextClasses);
        schoolsCache = schoolsData ?? [];
        educationLevelsCache = educationLevelsData ?? [];
        seriesCache = nextSeries;

        setClasses(nextClasses);
        setSchools(schoolsCache);
        setEducationLevels(educationLevelsCache);
        setSeries(seriesCache);
      } catch (err) {
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Erro ao carregar turmas";
        setError(message);
        setClasses([]);
        setEducationLevels([]);
        setSeries([]);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  const schoolMap = useMemo(() => {
    return new Map(schools.map((item) => [item.id, item.name]));
  }, [schools]);

  const mappedClasses = useMemo<ClassRow[]>(() => {
    return classes.map((item) => ({
      id: item.id,
      schoolId: item.school_id,
      name: item.name,
      code: item.code ?? item.suffix ?? "-",
      year: item.year,
      schoolName: schoolMap.get(item.school_id) ?? "-",
      educationLevel:
        item.education_level_name ??
        item.series_education_level_name ??
        item.education_level_id?.slice(0, 8) ??
        "-",
      teachers: item.teachers ?? [],
      scheduleCount: item.schedule_count ?? 0,
      createdAt: formatDate(item.created_at),
    }));
  }, [classes, schoolMap]);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();
    const normalizedQuery = normalizeSearchText(search.trim());
    const hasNormalizedQuery = normalizedQuery.length > 0;
    let result = mappedClasses;

    if (selectedSchoolId !== "all") {
      result = result.filter((item) => item.schoolId === selectedSchoolId);
    }

    if (!query) return result;

    return result.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      (hasNormalizedQuery && normalizeSearchText(item.name).includes(normalizedQuery)) ||
      item.code.toLowerCase().includes(query) ||
      (hasNormalizedQuery && normalizeSearchText(item.code).includes(normalizedQuery)) ||
      item.schoolName.toLowerCase().includes(query) ||
      (hasNormalizedQuery && normalizeSearchText(item.schoolName).includes(normalizedQuery)) ||
      item.educationLevel.toLowerCase().includes(query) ||
      (hasNormalizedQuery && normalizeSearchText(item.educationLevel).includes(normalizedQuery)) ||
      item.teachers.some(
        (teacher) =>
          teacher.name.toLowerCase().includes(query) ||
          (hasNormalizedQuery && normalizeSearchText(teacher.name).includes(normalizedQuery))
      ) ||
      String(item.year).includes(query)
    );
  }, [mappedClasses, search, selectedSchoolId]);

  const total = filteredClasses.length;
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

  const educationLevelOptions = useMemo(
    () =>
      educationLevels
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((level) => ({
          id: level.id,
          name: level.name,
        })),
    [educationLevels]
  );

  const seriesOptions = useMemo(
    () =>
      series
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => ({
          id: item.id,
          educationLevelId: item.education_level_id,
          name: item.name,
        })),
    [series]
  );

  const paginatedClasses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredClasses.slice(start, start + pageSize);
  }, [filteredClasses, page]);

  return {
    search,
    setSearch,
    classes: paginatedClasses,
    total,
    selectedSchoolId,
    setSelectedSchoolId,
    schoolOptions,
    educationLevelOptions,
    seriesOptions,
    page,
    pageSize,
    setPage,
    isLoading,
    error,
    refresh,
    createClass,
    deleteClass,
  };
}
