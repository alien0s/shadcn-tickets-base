import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { BRAND_NAME } from "@/config/brand";

export function LoginCard() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth(); // login async + estado loading vindo do contexto/hook

  const [email, setEmail] = useState(""); // controlled input
  const [password, setPassword] = useState(""); // controlled input
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // toggle visibilidade

  const handleForgotPassword = useCallback(() => {
    // Mantém UX: se o usuário já digitou email, preenche na tela de recuperação
    const normalizedEmail = email.trim(); // evita mandar " " na querystring
    const search = normalizedEmail
      ? `?email=${encodeURIComponent(normalizedEmail)}`
      : "";
    navigate(`/forgot-password${search}`);
  }, [email, navigate]);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev); // handler estável
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      // Normaliza entrada (muito comum usuário colar com espaços)
      const normalizedEmail = email.trim();
      const normalizedPassword = password; // se quiser, pode .trim(), mas senha geralmente não deve

      // Evita submit duplicado se o usuário apertar Enter rápido
      if (isLoading) return;

      await login({ email: normalizedEmail, password: normalizedPassword }); // hook decide como tratar erro/toast
    },
    [email, password, login, isLoading]
  );

  const handleGoogleLogin = useCallback(() => {
    // TODO(API/OAuth): implementar fluxo real de Google OAuth
    // Ex: auth.loginWithGoogle()
    console.warn("Google login not implemented yet");
  }, []);

  const handleSignup = useCallback(() => {
    // TODO: ajustar rota real de cadastro (se existir)
    // navigate("/signup");
    console.warn("Signup not implemented yet");
  }, []);

  return (
    <Card className="w-full max-w-sm shadow-sm">
      <div className="px-6 pt-6 text-center">
        <div className="text-2xl font-semibold">{BRAND_NAME}</div>
      </div>

      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl">Login na sua conta</CardTitle>
        <CardDescription>Informe seu email para acessar sua conta.</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@exemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)} // ok inline; pode virar useCallback se quiser
              required
              autoComplete="email" // melhora UX em browsers/password managers
              disabled={isLoading} // evita editar enquanto envia
              inputMode="email" // melhora teclado mobile
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={handleForgotPassword}
                disabled={isLoading} // evita navegação acidental enquanto envia
              >
                Esqueceu sua senha?
              </Button>
            </div>

            <div className="relative">
              <Input
                id="password"
                type={isPasswordVisible ? "text" : "password"}
                value={password}
                placeholder="Digite sua senha"
                onChange={(event) => setPassword(event.target.value)}
                required
                className="pr-10"
                autoComplete="current-password" // melhora UX e password managers
                disabled={isLoading}
              />

              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={togglePasswordVisibility}
                aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={isPasswordVisible} // a11y: indica estado do toggle
                disabled={isLoading as unknown as boolean} // HTMLButtonElement aceita disabled; se preferir use <Button variant="ghost" ...>
              >
                {isPasswordVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Login"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            Login com Google
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Não tem conta?{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={handleSignup}
              disabled={isLoading}
            >
              Cadastre-se
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
