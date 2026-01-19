import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth";
import { BRAND_NAME } from "@/config/brand";
import { usePageTitle } from "@/hooks/usePageTitle";

export function ForgotPasswordPage() {
  const { isAuthenticated } = useAuth(); // auth guard (evita ver página logado)
  const [searchParams] = useSearchParams(); // lê querystring (?email=...)
  const navigate = useNavigate();

  // Inicializa o email com o valor da URL (evita 1 render extra do useEffect)
  const [email, setEmail] = useState(() => searchParams.get("email") ?? ""); // lazy init
  const [isSubmitted, setIsSubmitted] = useState(false); // controla UI "enviado"

  usePageTitle("Recuperação de senha"); // título da página

  // Mantém email sincronizado se querystring mudar (mas só atualiza se realmente mudar)
  useEffect(() => {
    const nextEmail = searchParams.get("email") ?? ""; // extrai da URL
    setEmail((prev) => (prev === nextEmail ? prev : nextEmail)); // evita setState inútil
  }, [searchParams]);

  // Handler estável para voltar ao login (evita duplicação e funções inline)
  const goToLogin = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  // Guard: se já logado, não mostra a página
  if (isAuthenticated) {
    return <Navigate to="/dashboardtickets" replace />; // replace evita voltar pra página via "back"
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm shadow-sm">
        <div className="px-6 pt-6 text-center">
          <div className="text-2xl font-semibold">{BRAND_NAME}</div>
        </div>

        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl">Recuperar senha</CardTitle>
          <CardDescription>
            Informe seu email para receber o link de recuperação.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSubmitted ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Se o email existir, enviaremos um link para redefinir a senha.
              </p>

              <Button type="button" onClick={goToLogin}>
                Voltar para login
              </Button>
            </div>
          ) : (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();

                // TODO(API): aqui você chamará a rota de recovery:
                // await authApi.forgotPassword({ email })
                // e então: setIsSubmitted(true)

                setIsSubmitted(true); // mantém comportamento atual (mock)
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="recovery-email">Email</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  placeholder="m@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)} // controlled input
                  required
                />
              </div>

              <Button type="submit">Enviar link</Button>

              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={goToLogin} // reuse handler
              >
                Voltar para login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
