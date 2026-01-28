import { useCallback, useRef, useState } from "react";

export function useTwoFactor() {
  const [twoFactorEnabled, setTwoFactorEnabledState] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // ✅ evita setState após unmount (API-ready)
  const isMountedRef = useRef(true);

  // ✅ setter previsível + simulação de API
  const setTwoFactorEnabled = useCallback(async (next: boolean) => {
    setIsUpdating(true);

    try {
      // 🔧 mock de API (latência simulada)
      await new Promise((resolve) => setTimeout(resolve, 320));

      if (!isMountedRef.current) return;

      setTwoFactorEnabledState(next);
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, []);

  return {
    twoFactorEnabled,
    setTwoFactorEnabled, // mesma assinatura usada no componente
    isUpdating, // 🔧 opcional para UI futura (loading/disable)
  };
}
