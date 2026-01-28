import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'

type ProtectedRouteProps = {
  children: React.ReactNode
}

/**
 * Protege rota - apenas usuários autenticados podem acessar
 * Redireciona para /login se não estiver autenticado
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Aguarda validação do token
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  // Redireciona para login se não estiver autenticado
  // Salva a rota tentada para redirecionar após login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}