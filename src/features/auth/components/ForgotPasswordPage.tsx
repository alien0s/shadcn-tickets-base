import { useEffect, useState } from "react";
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
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const storedEmail = searchParams.get("email") ?? "";
    setEmail(storedEmail);
  }, [searchParams]);

  usePageTitle("Recuperação de senha");

  if (isAuthenticated) {
    return <Navigate to="/dashboardtickets" replace />;
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
              <Button type="button" onClick={() => navigate("/login")}>
                Voltar para login
              </Button>
            </div>
          ) : (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                setIsSubmitted(true);
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="recovery-email">Email</Label>
                <Input
                  id="recovery-email"
                  type="email"
                  placeholder="m@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <Button type="submit">Enviar link</Button>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={() => navigate("/login")}
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
