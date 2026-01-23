import { useEffect, useRef, useState } from "react";

export function useEntities() {
  const [entities, setEntities] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>("ANRA");

  // ✅ evita setState após unmount (API-ready)
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchEntities = async () => {
      try {
        // 🔧 mock de API
        const fakeApiData = ["ANRA", "ACeAm", "Asur", "MLA", "UNoB"];
        await new Promise((resolve) => setTimeout(resolve, 180));

        if (!isMountedRef.current) return;

        setEntities(fakeApiData);

        // ✅ valida seleção atual apenas após carregar a lista
        setSelectedEntity((current) =>
          fakeApiData.includes(current) ? current : fakeApiData[0]
        );
      } finally {
        // nada a finalizar aqui, mas mantém padrão previsível
      }
    };

    fetchEntities();

    return () => {
      isMountedRef.current = false;
    };
  }, []); // ✅ fetch só no mount (correto para API real)

  return {
    entities,
    selectedEntity,
    setSelectedEntity, // continua controlável externamente
  };
}
