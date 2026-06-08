export const SUBJECTS_CATALOG_VERSION_KEY = "subjects:catalog:version";
export const SUBJECTS_CATALOG_UPDATED_EVENT = "subjects-catalog:updated";

export function getSubjectsCatalogVersion(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SUBJECTS_CATALOG_VERSION_KEY);
  } catch {
    return null;
  }
}

export function markSubjectsCatalogUpdated(): string {
  const nextVersion = String(Date.now());

  if (typeof window === "undefined") {
    return nextVersion;
  }

  try {
    window.localStorage.setItem(SUBJECTS_CATALOG_VERSION_KEY, nextVersion);
  } catch {
    // Ignore storage errors; the in-page event still helps same-tab consumers.
  }

  window.dispatchEvent(
    new CustomEvent(SUBJECTS_CATALOG_UPDATED_EVENT, {
      detail: { version: nextVersion },
    })
  );

  return nextVersion;
}
