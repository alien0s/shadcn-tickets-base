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
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/grade" replace />
  }

  return <>{children}</>
}

