import { createContext, useCallback, useMemo, useState } from "react";
import type { AuthUser, LoginPayload } from "../types";
import { clearStoredUser, getStoredUser, setStoredUser } from "../utils/auth-storage";
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
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async ({ email, password }: LoginPayload) => {
    if (!email || !password) return;
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const nextUser = createMockUser(email);
    setUser(nextUser);
    setStoredUser(nextUser);
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearStoredUser();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
