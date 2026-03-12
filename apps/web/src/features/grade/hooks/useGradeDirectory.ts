import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib";

type SchoolApi = {
  id: string;
  name: string;
  abbreviation?: string | null;
};

type TeacherApi = {
  id: string;
  school_id: string;
  name: string;
  avatar_url?: string | null;
  subjects?: Array<{ id: string; name: string }>;
};

type UseGradeDirectoryResult = {
  schools: SchoolApi[];
  teachers: TeacherApi[];
  isLoadingSchools: boolean;
  isLoadingTeachers: boolean;
};

let schoolsCache: SchoolApi[] | null = null;
let teachersCache: TeacherApi[] | null = null;
let directoryPromise: Promise<{ schools: SchoolApi[]; teachers: TeacherApi[] }> | null = null;
const DIRECTORY_CACHE_KEY = "grade:directory:v1";

function readDirectoryCache(): { schools: SchoolApi[]; teachers: TeacherApi[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DIRECTORY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { schools?: SchoolApi[]; teachers?: TeacherApi[] };
    if (!Array.isArray(parsed.schools) || !Array.isArray(parsed.teachers)) return null;
    return { schools: parsed.schools, teachers: parsed.teachers };
  } catch {
    return null;
  }
}

function writeDirectoryCache(payload: { schools: SchoolApi[]; teachers: TeacherApi[] }) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DIRECTORY_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota/availability errors.
  }
}

const hydratedDirectory = readDirectoryCache();
if (hydratedDirectory) {
  schoolsCache = hydratedDirectory.schools;
  teachersCache = hydratedDirectory.teachers;
}

async function fetchDirectory(forceRefresh = false): Promise<{ schools: SchoolApi[]; teachers: TeacherApi[] }> {
  if (!forceRefresh && schoolsCache && teachersCache) {
    return { schools: schoolsCache, teachers: teachersCache };
  }

  if (directoryPromise) return directoryPromise;

  directoryPromise = Promise.all([
    api.get<SchoolApi[]>("/schools"),
    api.get<TeacherApi[]>("/teachers"),
  ])
    .then(([schools, teachers]) => {
      schoolsCache = schools ?? [];
      teachersCache = teachers ?? [];
      writeDirectoryCache({ schools: schoolsCache, teachers: teachersCache });
      return { schools: schoolsCache, teachers: teachersCache };
    })
    .finally(() => {
      directoryPromise = null;
    });

  return directoryPromise;
}

export async function primeGradeDirectoryCache(): Promise<void> {
  await fetchDirectory(true);
}

export function invalidateGradeDirectoryCache(): void {
  schoolsCache = null;
  teachersCache = null;
  directoryPromise = null;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DIRECTORY_CACHE_KEY);
  } catch {
    // Ignore storage quota/availability errors.
  }
}

export function useGradeDirectory(selectedSchoolId: string | null): UseGradeDirectoryResult {
  const [schools, setSchools] = useState<SchoolApi[]>([]);
  const [allTeachers, setAllTeachers] = useState<TeacherApi[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadDirectory = async () => {
      if (!schoolsCache || !teachersCache) {
        const hydrated = readDirectoryCache();
        if (hydrated) {
          schoolsCache = hydrated.schools;
          teachersCache = hydrated.teachers;
        }
      }

      if (schoolsCache && teachersCache) {
        setSchools(schoolsCache);
        setAllTeachers(teachersCache);
      }

      setIsLoadingSchools(true);
      setIsLoadingTeachers(true);
      try {
        const data = await fetchDirectory(true);
        if (!isCancelled) {
          setSchools(data.schools);
          setAllTeachers(data.teachers);
        }
      } catch {
        if (!isCancelled) {
          setSchools([]);
          setAllTeachers([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSchools(false);
          setIsLoadingTeachers(false);
        }
      }
    };

    loadDirectory();
    return () => {
      isCancelled = true;
    };
  }, []);

  const teachers = useMemo(() => {
    if (!selectedSchoolId) return allTeachers;
    return allTeachers.filter((teacher) => teacher.school_id === selectedSchoolId);
  }, [allTeachers, selectedSchoolId]);

  return {
    schools,
    teachers,
    isLoadingSchools,
    isLoadingTeachers,
  };
}

