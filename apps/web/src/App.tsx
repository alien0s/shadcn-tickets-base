import { useEffect } from "react"
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { TicketsPage } from "@/pages/TicketsPage"
import { DashboardTicketsPage } from "@/pages/DashboardTicketsPage"
import { GradePage } from "@/pages/GradePage"
import { MatrizPage } from "@/pages/MatrizPage"
import { HelpCenterPage } from "@/pages/HelpCenterPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { UsersPage } from "@/pages/users/UsersPage"
import { ClassesPage } from "@/pages/classes/ClassesPage"
import { TeachersPage } from "@/pages/teachers/TeachersPage"
import { SchoolsPage } from "@/pages/schools/SchoolsPage"
import { SchoolProfilePage } from "@/pages/schools/SchoolProfilePage"
import { SubjectsPage } from "@/pages/SubjectsPage"
import { RhPage } from "@/pages/RhPage"
import { OrganizationPage } from "@/pages/OrganizationPage"
import { LoginPage } from "@/pages/LoginPage"
import { SignupPage } from "@/pages/SignupPage"
import { ForgotPasswordPage } from "@/features/auth"
import { useAuth } from "@/features/auth"
import { useAppViewport } from "@/hooks/useAppViewport"
import { useIsApplePlatform } from "@/hooks/useIsApplePlatform"
import { Toaster } from "@/components/ui/sonner"
import { ProtectedRoute, RoleBasedRoute, PublicRoute } from "@/features/auth/components/routes"
import { useTenantSubdomainGuard } from "@/features/tenant/hooks/useTenantSubdomainGuard"
import { buildRootUrlForCurrentHost, getCurrentSubdomain } from "@/features/tenant/utils/subdomain"
import { getStoredToken, getStoredUser } from "@/features/auth/utils/auth-storage"
import { hasPendingAuthHandoff } from "@/features/auth/utils/auth-handoff"
import { replaceWithRedirectLock } from "@/features/tenant/utils/redirect-lock"

/**
 * Componente principal da aplicaÃ§Ã£o
 * 
 * Sistema de proteÃ§Ã£o de rotas:
 * - Rotas pÃºblicas: apenas nÃ£o autenticados (login, forgot-password)
 * - Rotas protegidas: apenas autenticados
 * - Rotas com role: apenas roles especÃ­ficas (dashboard = root/admin/agent)
 */
export default function App() {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  useTenantSubdomainGuard(user, isAuthenticated)

  // Inicializa ajuste de altura dinÃ¢mica para mobile
  useAppViewport()

  // Detecta se Ã© dispositivo Apple
  const isApplePlatform = useIsApplePlatform()

  // Aplica fonte Inter em plataformas nÃ£o-Apple
  useEffect(() => {
    if (!isApplePlatform) {
      document.documentElement.classList.add("font-inter")
    }
  }, [isApplePlatform])

  useEffect(() => {
    const currentSubdomain = getCurrentSubdomain(window.location.hostname)
    if (!currentSubdomain) return
    if (hasPendingAuthHandoff()) return

    const publicPaths = new Set(['/login', '/signup', '/forgot-password'])
    const isPublicPath = publicPaths.has(location.pathname)

    // PÃ¡ginas pÃºblicas sempre no domÃ­nio raiz (sem subdomÃ­nio)
    if (isPublicPath) {
      const targetUrl = buildRootUrlForCurrentHost(window.location, location.pathname, { preserveSearchAndHash: false })
      replaceWithRedirectLock(targetUrl)
      return
    }

    // Evita corrida enquanto sessÃ£o persistida Ã© restaurada
    const hasPersistedSession = Boolean(getStoredToken() && getStoredUser())
    if (!isAuthenticated && !hasPersistedSession) {
      const targetUrl = buildRootUrlForCurrentHost(window.location, '/login', { preserveSearchAndHash: false })
      replaceWithRedirectLock(targetUrl)
    }
  }, [isAuthenticated, location.pathname])

  // Define rota inicial baseada na role
  const getInitialPath = () => {
    if (!isAuthenticated || !user) return '/login'
    return '/grade'
  }

  return (
    <>
      <Routes>
        {/* Rota raiz: redireciona baseado no status de autenticaÃ§Ã£o */}
        <Route path="/" element={<Navigate to={getInitialPath()} replace />} />

        {/* ==================== ROTAS PÃšBLICAS ==================== */}
        {/* Apenas usuÃ¡rios NÃƒO autenticados podem acessar */}
        
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />

        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          } 
        />

        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          } 
        />

        {/* ==================== ROTAS PROTEGIDAS ==================== */}
        {/* Apenas usuÃ¡rios autenticados podem acessar */}

        {/* Dashboard - APENAS root, admin e agent */}
        <Route 
          path="/dashboardtickets" 
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['root', 'admin', 'agent']} redirectTo="/tickets">
                <DashboardTicketsPage />
              </RoleBasedRoute>
            </ProtectedRoute>
          } 
        />

        <Route
          path="/grade"
          element={
            <ProtectedRoute>
              <GradePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/matriz"
          element={
            <ProtectedRoute>
              <MatrizPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/turmas"
          element={
            <ProtectedRoute>
              <ClassesPage />
            </ProtectedRoute>
          }
        />

        <Route path="/classes" element={<Navigate to="/turmas" replace />} />

        <Route
          path="/professores"
          element={
            <ProtectedRoute>
              <TeachersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/materias"
          element={
            <ProtectedRoute>
              <SubjectsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rh"
          element={
            <ProtectedRoute>
              <RhPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizacao"
          element={
            <ProtectedRoute>
              <OrganizationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/escolas"
          element={
            <ProtectedRoute>
              <SchoolsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/escolas/:schoolId"
          element={
            <ProtectedRoute>
              <SchoolProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Lista de tickets - todos usuÃ¡rios autenticados */}
        <Route 
          path="/tickets" 
          element={
            <ProtectedRoute>
              <TicketsPage />
            </ProtectedRoute>
          } 
        />

        {/* Central de ajuda - todos usuÃ¡rios autenticados */}
        <Route 
          path="/help-center" 
          element={
            <ProtectedRoute>
              <HelpCenterPage />
            </ProtectedRoute>
          } 
        />

        {/* ConfiguraÃ§Ãµes - todos usuÃ¡rios autenticados */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />

        {/* Gerenciamento de usuÃ¡rios - root e client com tenant */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['root', 'client']} redirectTo="/tickets">
                <UsersPage />
              </RoleBasedRoute>
            </ProtectedRoute>
          } 
        />

        {/* Fallback: redireciona rotas inexistentes */}
        <Route path="*" element={<Navigate to={getInitialPath()} replace />} />
      </Routes>

      {/* Toast notifications global */}
      <Toaster />
    </>
  )
}


