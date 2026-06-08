import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function useRhClipboard(resetDelayMs = 1400) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current === null) return;
    window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = null;
  }, []);

  const copyValue = useCallback(
    async (key: string, value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        clearResetTimer();
        setCopiedKey(key);
        toast.success("Copiado para a área de transferência.");
        resetTimerRef.current = window.setTimeout(() => {
          setCopiedKey((current) => (current === key ? null : current));
          resetTimerRef.current = null;
        }, resetDelayMs);
      } catch {
        setCopiedKey(null);
      }
    },
    [clearResetTimer, resetDelayMs]
  );

  useEffect(() => clearResetTimer, [clearResetTimer]);

  return {
    copiedKey,
    copyValue,
  };
}
