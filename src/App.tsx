import { useEffect, useMemo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { TicketsPage } from "@/pages/TicketsPage";
import { DashboardTicketsPage } from "@/pages/DashboardTicketsPage";
import { HelpCenterPage } from "@/pages/HelpCenterPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { UsersPage } from "@/pages/users/UsersPage";
import { LoginPage } from "@/pages/LoginPage";
import { ForgotPasswordPage } from "@/features/auth";
import { useAppViewport } from "@/hooks/useAppViewport";
import { useIsApplePlatform } from "@/hooks/useIsApplePlatform";
import { Toaster } from "@/components/ui/sonner";

type UserRole = "admin" | "agent" | "client";

// TODO: Substituir por dados reais vindos do contexto de autenticação/API
// Exemplo futuro:
// const { user } = useAuth();
// const currentUserRole = user?.role || "client";
const currentUserRole: UserRole = "agent";

/**
 * Componente principal da aplicação
 * 
 * Responsabilidades:
 * - Configura roteamento de todas as páginas
 * - Inicializa hooks globais (viewport, detecção de plataforma)
 * - Define rota inicial baseada na role do usuário
 * - Aplica fonte Inter em plataformas não-Apple (Apple usa San Francisco)
 * 
 * @component
 * 
 * Rotas por perfil:
 * - Cliente: /tickets (lista de tickets)
 * - Admin/Agent: /dashboardtickets (métricas e visão geral)
 */
export default function App() {
  // Define rota inicial baseada na role do usuário
  // Memoizado para evitar recálculo em cada render
  const initialPath = useMemo(() => {
    return currentUserRole === "client" ? "/tickets" : "/dashboardtickets";
  }, []);

  // Inicializa ajuste de altura dinâmica para mobile
  useAppViewport();

  // Detecta se é dispositivo Apple (macOS, iOS, iPadOS)
  const isApplePlatform = useIsApplePlatform();

  // Aplica fonte Inter em plataformas não-Apple
  // Apple usa San Francisco (fonte do sistema) por padrão
  useEffect(() => {
    if (!isApplePlatform) {
      document.documentElement.classList.add("font-inter");
    }
  }, [isApplePlatform]);

  return (
    <>
      {/* Roteamento principal da aplicação */}
      <Routes>
        {/* Rota raiz: redireciona baseado na role do usuário */}
        <Route path="/" element={<Navigate to={initialPath} replace />} />

        {/* Dashboard com métricas (admin/agent) */}
        <Route path="/dashboardtickets" element={<DashboardTicketsPage />} />

        {/* Lista de tickets/conversas */}
        <Route path="/tickets" element={<TicketsPage />} />

        {/* Central de ajuda */}
        <Route path="/help-center" element={<HelpCenterPage />} />

        {/* Configurações da aplicação */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Página de login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Recuperação de senha */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Gerenciamento de usuários (admin) */}
        <Route path="/users" element={<UsersPage />} />

        {/* Fallback: redireciona rotas inexistentes para rota inicial */}
        <Route path="*" element={<Navigate to={initialPath} replace />} />
      </Routes>

      {/* Toast notifications global (Sonner) */}
      <Toaster />
    </>
  );
}