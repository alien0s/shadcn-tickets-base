import { Navigate } from "react-router-dom";
import { SignupCard, useAuth } from "@/features/auth";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * PÃ¡gina de Cadastro
 *
 * Exibe o formulÃ¡rio de cadastro centralizado na tela.
 * Redireciona automaticamente para o dashboard se o usuÃ¡rio jÃ¡ estiver autenticado.
 */
export function SignupPage() {
  const { isAuthenticated } = useAuth();

  usePageTitle("Criar conta");

  if (isAuthenticated) {
    return <Navigate to="/grade" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center px-4 py-8">
      <SignupCard />
    </div>
  );
}
