export type UserRole = "admin" | "agent" | "client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginPayload = {
  email: string;
  password: string;
};
