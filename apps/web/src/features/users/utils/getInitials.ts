/**
 * Extrai as iniciais de um nome completo
 * Retorna as primeiras letras do primeiro e segundo nome em maiúsculas
 * 
 * @param name - Nome completo do usuário
 * @returns Iniciais em maiúsculas (ex: "John Doe" → "JD")
 * 
 * @example
 * getInitials("Florence Shaw") // "FS"
 * getInitials("Maria") // "M"
 * getInitials("") // ""
 * getInitials("Ana Maria Silva") // "AM" (pega primeiro e segundo nome)
 */
export function getInitials(name: string): string {
  // Remove espaços extras e divide o nome em palavras
  const nameParts = name.trim().split(/\s+/);
  
  // Extrai primeira e segunda palavra (se existirem)
  const [first = "", second = ""] = nameParts;
  
  // Retorna primeira letra de cada parte em maiúsculas
  return `${first[0] || ""}${second[0] || ""}`.toUpperCase();
}
