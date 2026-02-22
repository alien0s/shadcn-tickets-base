import { useCallback, useMemo, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
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
import { BRAND_NAME } from "@/config/brand";
import { useAuth } from "../hooks/useAuth";

const DEFAULT_ROLE_ID = "650e8400-e29b-41d4-a716-446655440002";
const DEFAULT_ENTITY_ID = "550e8400-e29b-41d4-a716-446655440001";

// ✅ Componente extraído para reutilização
interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  isInvalid?: boolean;
  disabled?: boolean;
  minLength?: number;
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "new-password",
  isInvalid = false,
  disabled = false,
  minLength = 8,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          required
          minLength={minLength}
          className="pr-10"
          autoComplete={autoComplete}
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          aria-invalid={isInvalid}
          disabled={disabled}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          onClick={toggleVisibility}
          aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={isVisible}
          disabled={disabled}
          tabIndex={-1}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function SignupCard() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ✅ Validações memorizadas
  const isPasswordTooShort = useMemo(() => {
    if (!password) return false;
    return password.length < 8;
  }, [password]);

  const isPasswordMismatch = useMemo(() => {
    if (!confirmPassword) return false;
    return password !== confirmPassword;
  }, [password, confirmPassword]);

  const isFormInvalid = useMemo(
    () => isPasswordMismatch || isPasswordTooShort,
    [isPasswordMismatch, isPasswordTooShort]
  );

  // ✅ Handlers otimizados - evitam re-renders
  const handleFirstNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);
  }, []);

  const handleLastNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setLastName(e.target.value);
  }, []);

  const handleEmailChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  // ✅ Callbacks para PasswordInput (não precisam de useCallback aqui pois já são setters estáveis)
  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
  }, []);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setConfirmPassword(value);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isFormInvalid) return;

      const normalizedEmail = email.trim();
      const normalizedFirstName = firstName.trim();
      const normalizedLastName = lastName.trim();

      const isRegistered = await register({
        name: normalizedFirstName,
        last_name: normalizedLastName,
        email: normalizedEmail,
        password,
        entity_id: DEFAULT_ENTITY_ID,
        role_id: DEFAULT_ROLE_ID,
      });

      if (isRegistered) {
        navigate("/login");
      }
    },
    [email, firstName, lastName, password, isFormInvalid, register, navigate]
  );

  const handleGoToLogin = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  return (
    <Card className="w-full max-w-sm shadow-sm">
      <div className="px-6 pt-6 text-center">
        <div className="text-2xl font-semibold">{BRAND_NAME}</div>
      </div>

      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl">Crie sua conta</CardTitle>
        <CardDescription>Preencha seus dados para se cadastrar.</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Seu nome"
                value={firstName}
                onChange={handleFirstNameChange}
                required
                autoComplete="given-name"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Seu sobrenome"
                value={lastName}
                onChange={handleLastNameChange}
                required
                autoComplete="family-name"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={handleEmailChange}
              required
              autoComplete="email"
              inputMode="email"
              disabled={isLoading}
            />
          </div>

          <PasswordInput
            id="password"
            label="Senha"
            value={password}
            onChange={handlePasswordChange}
            disabled={isLoading}
          />

          <div>
            <PasswordInput
              id="confirmPassword"
              label="Confirmar senha"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              isInvalid={isPasswordMismatch}
              disabled={isLoading}
            />
            {isPasswordMismatch && (
              <p className="mt-1.5 text-xs text-destructive">As senhas não conferem.</p>
            )}
            {isPasswordTooShort && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                A senha deve ter no mínimo 8 caracteres.
              </p>
            )}
          </div>

          <Button type="submit" disabled={isFormInvalid || isLoading}>
            {isLoading ? "Criando conta..." : "Criar conta"}
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Já tenho conta{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={handleGoToLogin}
              disabled={isLoading}
            >
              Entrar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
