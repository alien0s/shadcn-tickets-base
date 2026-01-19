// types.ts (auth)

/**
 * Papéis possíveis do usuário.
 * Usado para:
 * - controle de acesso (RBAC)
 * - render condicional
 * - permissões futuras
 */
export type UserRole = "admin" | "agent" | "client";

/**
 * Modelo do usuário autenticado no frontend.
 * Dados não sensíveis (tokens ficam fora).
 */
export type AuthUser = {
  id: string;      // id único (uuid ou number vindo da API)
  name: string;    // nome exibido no UI
  email: string;   // email do usuário
  role: UserRole;  // papel para autorização
};

/**
 * Payload de login.
 * Usado no form e no auth-context.
 */
export type LoginPayload = {
  email: string;
  password: string;
};
