import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { TicketsPage } from "@/pages/TicketsPage"
import { DashboardTicketsPage } from "@/pages/DashboardTicketsPage"
import { HelpCenterPage } from "@/pages/HelpCenterPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { UsersPage } from "@/pages/users/UsersPage"
import { LoginPage } from "@/pages/LoginPage"
import { SignupPage } from "@/pages/SignupPage"
import { ForgotPasswordPage } from "@/features/auth"
import { useAuth } from "@/features/auth"
import { useAppViewport } from "@/hooks/useAppViewport"
import { useIsApplePlatform } from "@/hooks/useIsApplePlatform"
import { Toaster } from "@/components/ui/sonner"
import { ProtectedRoute, RoleBasedRoute, PublicRoute } from "@/features/auth/components/routes"

/**
 * Componente principal da aplicação
 * 
 * Sistema de proteção de rotas:
 * - Rotas públicas: apenas não autenticados (login, forgot-password)
 * - Rotas protegidas: apenas autenticados
 * - Rotas com role: apenas roles específicas (dashboard = admin/agent)
 */
export default function App() {
  const { user, isAuthenticated } = useAuth()

  // Inicializa ajuste de altura dinâmica para mobile
  useAppViewport()

  // Detecta se é dispositivo Apple
  const isApplePlatform = useIsApplePlatform()

  // Aplica fonte Inter em plataformas não-Apple
  useEffect(() => {
    if (!isApplePlatform) {
      document.documentElement.classList.add("font-inter")
    }
  }, [isApplePlatform])

  // Define rota inicial baseada na role
  const getInitialPath = () => {
    if (!isAuthenticated || !user) return '/login'
    return user.role === 'client' ? '/tickets' : '/dashboardtickets'
  }

  return (
    <>
      <Routes>
        {/* Rota raiz: redireciona baseado no status de autenticação */}
        <Route path="/" element={<Navigate to={getInitialPath()} replace />} />

        {/* ==================== ROTAS PÚBLICAS ==================== */}
        {/* Apenas usuários NÃO autenticados podem acessar */}
        
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
        {/* Apenas usuários autenticados podem acessar */}

        {/* Dashboard - APENAS admin e agent */}
        <Route 
          path="/dashboardtickets" 
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['admin', 'agent']} redirectTo="/tickets">
                <DashboardTicketsPage />
              </RoleBasedRoute>
            </ProtectedRoute>
          } 
        />

        {/* Lista de tickets - todos usuários autenticados */}
        <Route 
          path="/tickets" 
          element={
            <ProtectedRoute>
              <TicketsPage />
            </ProtectedRoute>
          } 
        />

        {/* Central de ajuda - todos usuários autenticados */}
        <Route 
          path="/help-center" 
          element={
            <ProtectedRoute>
              <HelpCenterPage />
            </ProtectedRoute>
          } 
        />

        {/* Configurações - todos usuários autenticados */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />

        {/* Gerenciamento de usuários - APENAS admin */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <RoleBasedRoute allowedRoles={['admin']} redirectTo="/tickets">
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
