import { createContext, useCallback, useMemo, useRef, useState, useEffect } from "react"
import type { UserRole, AuthUser, LoginPayload, LoginResponse, RegisterPayload } from "../types"
import { clearAuth, getStoredUser, setStoredUser, setStoredToken, getStoredToken } from "../utils/auth-storage"
import { getClientDeviceInfo } from "../utils/device-info"
import { api } from '@/lib'
import { toast } from "sonner"


type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  requires2FA: boolean
  pendingEmail: string | null
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<boolean>
  verify2FA: (code: string) => Promise<void>
  logout: () => void
  enable2FA: () => Promise<void>
  disable2FA: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type AuthProviderProps = {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [isLoading, setIsLoading] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const isLoggingInRef = useRef(false)

  /**
   * ✅ MODIFICAÇÃO 1: Setar token ao carregar
   */
  useEffect(() => {
    const validateToken = async () => {
      const token = getStoredToken()
      const storedUser = getStoredUser()

      if (token && storedUser) {
        try {
          // ✅ NOVO: Setar token no Supabase Realtime
         
          
          setUser(storedUser)
        } catch {
          clearAuth()
          setUser(null)
        }
      }
    }

    validateToken()
  }, [])

  /**
   * ✅ MODIFICAÇÃO 2: Setar token após login
   */
  const login = useCallback(
    async ({ email, password }: LoginPayload) => {
      const normalizedEmail = email.trim()

      if (!normalizedEmail || !password) return
      if (isLoggingInRef.current || isLoading) return

      isLoggingInRef.current = true
      setIsLoading(true)

      try {
        const deviceInfo = await getClientDeviceInfo()
        const data = await api.post<LoginResponse>('/auth/login', {
          email: normalizedEmail,
          password
        })

        // Verificar se precisa de 2FA
        if (data.requires_2fa) {
          setRequires2FA(true)
          setPendingEmail(normalizedEmail)
          return
        }

        // Login bem-sucedido
        if (data.user && data.token) {
          const mappedUser: AuthUser = {
            id: data.user.id,
            name: data.user.name,
            last_name: data.user.last_name,
            email: data.user.email,
            avatar_url: data.user.avatar_url,
            department_id: data.user.department_id,
            entity_id: data.user.entity_id,
            role_id: data.user.role_id,
            two_factor_enabled: data.user.two_factor_enabled,
            last_login_at: data.user.last_login_at,
            is_active: data.user.is_active,
            role: (data.user.role_name?.toLowerCase() || 'client') as UserRole,
            os_id: deviceInfo.os_id,
            browser: deviceInfo.browser
          }
          setUser(mappedUser)
          setStoredUser(mappedUser)
          setStoredToken(data.token)
          
          
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao fazer login"
        toast.error(message)
      } finally {
        setIsLoading(false)
        isLoggingInRef.current = false
      }
    },
    [isLoading]
  )

  /**
   * Cadastro (sem modificação)
   */
  const register = useCallback(async (payload: RegisterPayload) => {
    if (isLoading) return false

    setIsLoading(true)

    try {
      const { message } = await api.postWithMeta("/auth/register", payload)
      toast.success(message || "Usuário cadastrado com sucesso")
      return true
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar conta"
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  /**
   * ✅ MODIFICAÇÃO 3: Setar token após verificar 2FA
   */
  const verify2FA = useCallback(async (code: string) => {
    if (!pendingEmail) throw new Error('Email não encontrado')

    setIsLoading(true)

    try {
      const deviceInfo = await getClientDeviceInfo()
      const data = await api.post<LoginResponse>('/auth/verify-2fa', {
        email: pendingEmail,
        code
      })

      if (data.user && data.token) {
        const mappedUser: AuthUser = {
          id: data.user.id,
          name: data.user.name,
          last_name: data.user.last_name,
          email: data.user.email,
          avatar_url: data.user.avatar_url,
          department_id: data.user.department_id,
          entity_id: data.user.entity_id,
          role_id: data.user.role_id,
          two_factor_enabled: data.user.two_factor_enabled,
          last_login_at: data.user.last_login_at,
          is_active: data.user.is_active,
          role: (data.user.role_name?.toLowerCase() || 'client') as UserRole,
          os_id: deviceInfo.os_id,
          browser: deviceInfo.browser
        }
        setUser(mappedUser)
        setStoredUser(mappedUser)
        setStoredToken(data.token)
        
        
        
        setRequires2FA(false)
        setPendingEmail(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [pendingEmail])

  /**
   * Logout (sem modificação)
   */
  const logout = useCallback(() => {
    setUser(null)
    clearAuth()
    setIsLoading(false)
    setRequires2FA(false)
    setPendingEmail(null)
    isLoggingInRef.current = false
  }, [])

  /**
   * Habilitar 2FA (sem modificação)
   */
  const enable2FA = useCallback(async () => {
    await api.post('/auth/enable-2fa')

    if (user) {
      const updatedUser = { ...user, two_factor_enabled: true }
      setUser(updatedUser)
      setStoredUser(updatedUser)
    }
  }, [user])

  /**
   * Desabilitar 2FA (sem modificação)
   */
  const disable2FA = useCallback(async () => {
    await api.post('/auth/disable-2fa')

    if (user) {
      const updatedUser = { ...user, two_factor_enabled: false }
      setUser(updatedUser)
      setStoredUser(updatedUser)
    }
  }, [user])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      requires2FA,
      pendingEmail,
      login,
      register,
      verify2FA,
      logout,
      enable2FA,
      disable2FA
    }),
    [user, isLoading, requires2FA, pendingEmail, login, register, verify2FA, logout, enable2FA, disable2FA]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}