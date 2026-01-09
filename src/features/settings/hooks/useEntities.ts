import { useEffect, useState } from "react";

export function useEntities() {
  const [entities, setEntities] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>("ANRA");

  useEffect(() => {
    const fetchEntities = async () => {
      const fakeApiData = ["ANRA", "ACeAm", "Asur", "MLA", "UNoB"];
      await new Promise((resolve) => setTimeout(resolve, 180));
      setEntities(fakeApiData);
      if (!fakeApiData.includes(selectedEntity)) {
        setSelectedEntity(fakeApiData[0]);
      }
    };
    fetchEntities();
  }, [selectedEntity]);

  return {
    entities,
    selectedEntity,
    setSelectedEntity,
  };
}
