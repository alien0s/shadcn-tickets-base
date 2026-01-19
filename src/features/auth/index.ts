// index.ts (barrel da feature auth)
// Centraliza exports para facilitar imports do resto do app.

// Provider / Hook (API pública principal da feature)
export { AuthProvider } from "./context/auth-context";
export { useAuth } from "./hooks/useAuth";

// UI (componentes/páginas)
export { ForgotPasswordPage } from "./components/ForgotPasswordPage";
export { LoginCard } from "./components/LoginCard";

// Types (para payloads e contratos)
export type { AuthUser, LoginPayload, UserRole } from "./types";

