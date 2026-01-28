import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import type { UserRole } from '@/features/auth/types'

type RoleBasedRouteProps = {
  children: React.ReactNode
  allowedRoles: UserRole[]
  redirectTo?: string
}

/**
 * Protege rota baseado em roles
 * Redireciona para rota alternativa se role não for permitida
 */
export function RoleBasedRoute({ 
  children, 
  allowedRoles,
  redirectTo = '/tickets'
}: RoleBasedRouteProps) {
  const { user, isLoading } = useAuth()  // ← ADICIONAR isLoading

  // ✅ AGUARDAR CARREGAMENTO
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  // Se não tiver role ou role não permitida, redireciona
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}