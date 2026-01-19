import type { AuthUser, UserRole } from "../types";

/**
 * Mapeamento simples de domínio → role
 * MOCK apenas para desenvolvimento.
 *
 * Ex:
 * - admin@empresa.com → admin
 * - agent@suporte.com → agent
 * - client@cliente.com → client
 */
const ROLE_BY_DOMAIN: Record<string, UserRole> = {
  admin: "admin",
  agent: "agent",
  client: "client",
};

/**
 * Cria um usuário mockado a partir do email.
 * Usado apenas em ambiente sem API real.
 */
export function createMockUser(email: string): AuthUser {
  const normalizedEmail = email.trim().toLowerCase(); // evita inconsistências

  // Extrai o "nome" antes do @
  const rawName = normalizedEmail.split("@")[0] || "usuario";

  // Limpa caracteres comuns em emails para exibição
  const name = rawName
    .replace(/[._-]/g, " ") // troca separadores por espaço
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitaliza palavras

  // Usa o domínio para inferir role (heurística de mock)
  const domainKey =
    normalizedEmail.split("@")[1]?.split(".")[0] ?? "";

  const role: UserRole = ROLE_BY_DOMAIN[domainKey] ?? "agent"; // fallback seguro

  return {
    id: `user-${crypto.randomUUID?.() ?? Date.now()}`, // uuid se disponível, fallback seguro
    name,
    email: normalizedEmail,
    role,
  };
}
