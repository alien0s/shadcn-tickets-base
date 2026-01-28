import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'

type PublicRouteProps = {
  children: React.ReactNode
}

/**
 * Rota pública - apenas para usuários NÃO autenticados
 * Redireciona para rota inicial se já estiver logado
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated) {
    // Redireciona para rota inicial baseado na role
    const initialPath = user?.role === 'client' ? '/tickets' : '/dashboardtickets'
    return <Navigate to={initialPath} replace />
  }

  return <>{children}</>
}