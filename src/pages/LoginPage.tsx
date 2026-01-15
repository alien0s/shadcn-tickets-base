import { Navigate } from "react-router-dom";
import { LoginCard, useAuth } from "@/features/auth";
import { usePageTitle } from "@/hooks/usePageTitle";

export function LoginPage() {
  const { isAuthenticated } = useAuth();

  usePageTitle("Entrar");

  if (isAuthenticated) {
    return <Navigate to="/dashboardtickets" replace />;
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center px-4 py-8">
      <LoginCard />
    </div>
  );
}
