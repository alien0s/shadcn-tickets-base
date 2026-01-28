import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Edit3, ShieldCheck } from "lucide-react";
import { ProfileField } from "./ProfileField";
import type { SecuritySectionProps } from "../types";

export function SecuritySection({
  twoFactorEnabled,
  onToggleTwoFactor,
}: SecuritySectionProps) {
  const twoFactorSwitchId = useId(); // ✅ a11y: associa switch ao rótulo

  return (
    <>
      <div className="flex flex-col gap-2 border-b border-border px-1 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
        <div className="space-y-1">
          <p className="text-base font-semibold">Seguranca</p>
          <p className="text-sm text-muted-foreground">
            Gerencie a senha e ative camadas extras de protecao.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Ultima revisao de seguranca ha 30 dias.
        </div>
      </div>

      <div className="divide-y divide-border">
        <ProfileField
          title="Senha"
          description="Troque a senha regularmente para manter a conta protegida."
        >
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-3 sm:px-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-[0.2rem]">••••••••</p>
              <p className="text-xs text-muted-foreground">
                Ultima alteracao ha 3 meses.
              </p>
            </div>

            <Button
              type="button" // ✅ evita submit acidental
              variant="outline"
              size="icon"
              aria-label="Editar senha"
            >
              <Edit3 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </ProfileField>

        <ProfileField
          title="Autenticacao em duas etapas"
          description="Exige um segundo fator ao entrar para evitar acessos indevidos."
        >
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-3 sm:px-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                    twoFactorEnabled
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100"
                      : "bg-muted text-muted-foreground"
                  )}
                  aria-label={`Autenticação em duas etapas ${twoFactorEnabled ? "ativada" : "desativada"}`} // ✅ a11y sem mudar UI
                >
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {twoFactorEnabled ? "Ativada" : "Desativada"}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Receba um codigo no email ao fazer login.
              </p>
            </div>

            <Switch
              id={twoFactorSwitchId}
              checked={twoFactorEnabled}
              onCheckedChange={onToggleTwoFactor}
              aria-label="Alternar autenticação em duas etapas" // ✅ a11y
            />
          </div>
        </ProfileField>
      </div>
    </>
  );
}
