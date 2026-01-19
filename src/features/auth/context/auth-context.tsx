import { createContext, useCallback, useMemo, useRef, useState } from "react";
import type { AuthUser, LoginPayload } from "../types";
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from "../utils/auth-storage";
import { createMockUser } from "../utils/create-mock-user";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser()); // lazy init evita ler storage em todo render
  const [isLoading, setIsLoading] = useState(false);

  // Ref para evitar submit concorrente (ex: clique duplo no botão de login)
  const isLoggingInRef = useRef(false);

  const login = useCallback(
    async ({ email, password }: LoginPayload) => {
      const normalizedEmail = email.trim(); // evita "email com espaço" (caso comum)
      const normalizedPassword = password; // senha geralmente não deve trim

      // Validação mínima (no futuro: retornar erro/sonner)
      if (!normalizedEmail || !normalizedPassword) return;

      // Bloqueia login concorrente (clique duplo / Enter repetido)
      if (isLoggingInRef.current || isLoading) return; // isLoading = state; ref = mais imediato
      isLoggingInRef.current = true;

      setIsLoading(true); // ativa loading para UI (botão "Entrando...")

      try {
        // MOCK: simula request; no futuro vira: await authApi.login(...)
        await new Promise((resolve) => setTimeout(resolve, 300));

        const nextUser = createMockUser(normalizedEmail); // cria usuário fake
        setUser(nextUser); // atualiza state
        setStoredUser(nextUser); // persiste no localStorage (sessão)
      } finally {
        // ✅ garante que loading sempre desliga, mesmo se der erro no futuro (API)
        setIsLoading(false);
        isLoggingInRef.current = false;
      }
    },
    [isLoading]
  );

  const logout = useCallback(() => {
    setUser(null); // zera user no state
    clearStoredUser(); // remove do storage
    setIsLoading(false); // segurança: se algo estiver carregando, UI não fica travada
    isLoggingInRef.current = false; // reseta guard de concorrência
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user), // derivado do user (não precisa estado separado)
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
