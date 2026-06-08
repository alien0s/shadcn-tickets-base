import type { TenantInfo } from "@ticket-system/types";
import { Building2, LogOut, Pencil } from "lucide-react";
import { useAuth } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrganizationTabs } from "./OrganizationTabs";
import type { FieldSection } from "../utils/organization-view";

type OrganizationContentProps = {
  tenantInfo: TenantInfo | null;
  isLoading: boolean;
  error: string | null;
  profileSections: FieldSection[];
  billingSections: FieldSection[];
  onEdit: () => void;
};

function LoadingInfoRow({ label, width }: { label: string; width: string }) {
  return (
    <div className="grid gap-1 border-b border-border/70 py-2 last:border-b-0 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd>
        <Skeleton className={`h-5 ${width}`} />
      </dd>
    </div>
  );
}

function LoadingPanel() {
  const { user } = useAuth();
  const organizationName = user?.tenant_name?.trim() || "Organizacao";

  return (
    <div className="space-y-4">
      <div className="flex h-auto w-full flex-row flex-nowrap items-center justify-start gap-2 overflow-x-auto rounded-none bg-transparent p-0 text-muted-foreground">
        <div className="h-auto min-w-[96px] rounded-md bg-primary/10 px-2.5 py-2.5 text-center text-sm font-medium text-primary sm:min-w-[110px] sm:px-3">
          Informacoes
        </div>
        <div className="h-auto min-w-[96px] rounded-md bg-transparent px-2.5 py-2.5 text-center text-sm font-normal text-muted-foreground sm:min-w-[110px] sm:px-3">
          Financeiro
        </div>
        <div className="h-auto min-w-[96px] rounded-md bg-transparent px-2.5 py-2.5 text-center text-sm font-normal text-muted-foreground sm:min-w-[110px] sm:px-3">
          Plano
        </div>
      </div>

      <section className="w-full space-y-5 rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/40">
              <Building2 className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            </div>

            <div className="min-w-0 space-y-2">
              <h2 className="break-words text-2xl font-bold leading-tight text-foreground">{organizationName}</h2>
              <p className="text-sm text-muted-foreground">
                Cliente desde <Skeleton className="ml-1 inline-flex h-4 w-28 align-middle" />
              </p>
            </div>
          </div>

          <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 md:w-auto" disabled>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Editar
          </Button>
        </div>

        <div className="space-y-5 border-t border-border pt-5">
          <section className="border-t border-border pt-5 first:border-t-0 first:pt-0">
            <h2 className="text-sm font-semibold text-foreground">Detalhes da empresa</h2>
            <dl className="mt-2 grid gap-x-6 md:grid-cols-2">
              <LoadingInfoRow label="CNPJ" width="w-40" />
              <LoadingInfoRow label="Telefone" width="w-32" />
              <LoadingInfoRow label="Email" width="w-52" />
              <LoadingInfoRow label="Endereco" width="w-36" />
              <LoadingInfoRow label="Cidade" width="w-28" />
              <LoadingInfoRow label="Estado" width="w-16" />
              <LoadingInfoRow label="CEP" width="w-24" />
            </dl>
          </section>
        </div>
      </section>

      <section className="w-full rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Informacoes de contato do perfil</h2>
            <p className="mt-1 text-sm text-muted-foreground">Dados do usuario autenticado nesta organizacao.</p>
          </div>

          <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 md:w-auto" disabled>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </Button>
        </div>

        <dl className="mt-5 grid gap-x-6 md:grid-cols-2">
          <LoadingInfoRow label="Nome" width="w-40" />
          <LoadingInfoRow label="Funcao" width="w-24" />
          <LoadingInfoRow label="Email" width="w-52" />
          <LoadingInfoRow label="Telefone" width="w-32" />
        </dl>
      </section>
    </div>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="w-full rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground sm:p-6">
      {children}
    </div>
  );
}

export function OrganizationContent({
  tenantInfo,
  isLoading,
  error,
  profileSections,
  billingSections,
  onEdit,
}: OrganizationContentProps) {
  if (isLoading) {
    return <LoadingPanel />;
  }

  if (error) {
    return <EmptyState>{error}</EmptyState>;
  }

  if (!tenantInfo) {
    return <EmptyState>Nenhuma organizacao encontrada.</EmptyState>;
  }

  return (
    <OrganizationTabs
      tenantInfo={tenantInfo}
      profileSections={profileSections}
      billingSections={billingSections}
      onEdit={onEdit}
    />
  );
}
