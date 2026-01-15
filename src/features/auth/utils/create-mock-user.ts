import type { AuthUser, UserRole } from "../types";

const ROLE_BY_DOMAIN: Record<string, UserRole> = {
  admin: "admin",
  agent: "agent",
  client: "client",
};

export function createMockUser(email: string): AuthUser {
  const name = email.split("@")[0] || "Usuario";
  const domainKey = email.split("@")[1]?.split(".")[0] || "";
  const role = ROLE_BY_DOMAIN[domainKey] ?? "agent";

  return {
    id: `user-${Date.now()}`,
    name: name.replace(/[._-]/g, " "),
    email,
    role,
  };
}
