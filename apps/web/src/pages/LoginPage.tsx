import { Navigate } from "react-router-dom";
import { LoginCard, useAuth } from "@/features/auth";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Página de Login
 * 
 * Exibe o formulário de login centralizado na tela.
 * Redireciona automaticamente para o dashboard se o usuário já estiver autenticado.
 * 
 * @component
 * 
 * Fluxo:
 * 1. Verifica se usuário já está autenticado
 * 2. Se SIM: redireciona para /dashboardtickets
 * 3. Se NÃO: exibe formulário de login
 * 
 * Layout:
 * - Tela cheia (min-h-screen)
 * - Conteúdo centralizado vertical e horizontal
 * - Padding responsivo (px-4 py-8)
 */
export function LoginPage() {
  // Verifica estado de autenticação do usuário
  const { isAuthenticated } = useAuth();

  // Define título da aba do navegador
  usePageTitle("Entrar");

  // Redireciona para dashboard se já estiver logado
  // replace: não adiciona na pilha de histórico (impede voltar)
  if (isAuthenticated) {
    return <Navigate to="/dashboardtickets" replace />;
  }

  // Renderiza página de login
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center px-4 py-8">
      <LoginCard />
    </div>
  );
}