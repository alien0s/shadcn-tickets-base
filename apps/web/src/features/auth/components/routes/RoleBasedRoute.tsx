import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import type { UserRole } from '@/features/auth/types'
import { AuthRouteLoader } from './AuthRouteLoader'

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
  const { user, isHydratingSession } = useAuth()

  if (isHydratingSession) {
    return <AuthRouteLoader />
  }

  // Se não tiver role ou role não permitida, redireciona
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
