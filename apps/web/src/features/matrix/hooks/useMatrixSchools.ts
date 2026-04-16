import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type MatrizSchool = {
  id: string;
  name: string;
  abbreviation?: string | null;
};

type MatrizEducationLevel = {
  id: string;
  name: string;
  abbreviation?: string | null;
};

function buildAbbreviation(name: string): string {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "ESC";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();

  return words
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function useMatrizSchools() {
  const [schools, setSchools] = useState<MatrizSchool[]>([]);
  const [educationLevels, setEducationLevels] = useState<MatrizEducationLevel[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedEducationLevelId, setSelectedEducationLevelId] = useState("");
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadBaseData = async () => {
      setIsLoadingSchools(true);
      setError(null);

      try {
        const [schoolsData, educationLevelsData] = await Promise.all([
          api.get<MatrizSchool[]>("/schools"),
          api.get<MatrizEducationLevel[]>("/education-levels"),
        ]);

        if (!isActive) return;

        const nextSchools = (schoolsData ?? []).filter(Boolean);
        const nextEducationLevels = (educationLevelsData ?? []).filter(Boolean);

        setSchools(nextSchools);
        setEducationLevels(nextEducationLevels);
        setSelectedSchoolId((current) => {
          if (current && nextSchools.some((school) => school.id === current)) {
            return current;
          }

          return nextSchools[0]?.id ?? "";
        });
        setSelectedEducationLevelId((current) => {
          if (current && nextEducationLevels.some((level) => level.id === current)) {
            return current;
          }

          return nextEducationLevels[0]?.id ?? "";
        });
      } catch (requestError) {
        if (!isActive) return;

        setSchools([]);
        setEducationLevels([]);
        setSelectedSchoolId("");
        setSelectedEducationLevelId("");
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar as escolas."
        );
      } finally {
        if (isActive) setIsLoadingSchools(false);
      }
    };

    void loadBaseData();

    return () => {
      isActive = false;
    };
  }, []);

  const schoolOptions = useMemo(
    () =>
      schools.map((school) => ({
        value: school.id,
        label: school.abbreviation?.trim()
          ? school.abbreviation.trim().toUpperCase()
          : buildAbbreviation(school.name),
      })),
    [schools]
  );

  const educationLevelOptions = useMemo(
    () =>
      educationLevels.map((level) => ({
        value: level.id,
        label: level.abbreviation?.trim() || level.name,
        fullName: level.name,
      })),
    [educationLevels]
  );

  return {
    selectedSchoolId,
    setSelectedSchoolId,
    selectedEducationLevelId,
    setSelectedEducationLevelId,
    schoolOptions,
    educationLevelOptions,
    isLoadingSchools,
    error,
  };
}
