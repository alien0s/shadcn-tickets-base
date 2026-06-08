import { useCallback } from "react";

const PRINT_CLASS_NAME = "grade-snapshot-printing";
const PRINT_CLEANUP_TIMEOUT_MS = 60_000;

export function useGradeSnapshotPrint() {
  const printCurrentGradeSnapshot = useCallback(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let fallbackCleanupTimer: number | undefined;

    const cleanup = () => {
      document.body.classList.remove(PRINT_CLASS_NAME);
      window.removeEventListener("afterprint", cleanup);
      if (fallbackCleanupTimer) {
        window.clearTimeout(fallbackCleanupTimer);
      }
    };

    document.body.classList.add(PRINT_CLASS_NAME);
    window.addEventListener("afterprint", cleanup, { once: true });

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.print();
        fallbackCleanupTimer = window.setTimeout(cleanup, PRINT_CLEANUP_TIMEOUT_MS);
      });
    });
  }, []);

  return { printCurrentGradeSnapshot };
}
