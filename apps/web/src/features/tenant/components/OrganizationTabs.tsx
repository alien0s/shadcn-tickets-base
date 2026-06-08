import { Building2, CheckCircle2, CreditCard, Download, Landmark, LogOut, MoreVertical, Pencil, QrCode } from "lucide-react";
import type { TenantInfo } from "@ticket-system/types";
import { useAuth } from "@/features/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useTenantExitConfirmation } from "../hooks/useTenantExitConfirmation";
import type { Field, FieldSection, PlanCard } from "../utils/organization-view";
import {
  getOrganizationCustomerSinceLabel,
  getOrganizationDisplayName,
  normalizePlan,
  PLAN_CARDS,
} from "../utils/organization-view";

type OrganizationTabsProps = {
  tenantInfo: TenantInfo;
  profileSections: FieldSection[];
  billingSections: FieldSection[];
  onEdit: () => void;
};

function getRoleLabel(role?: string) {
  if (role === "root") return "Root";
  if (role === "admin") return "Administrador";
  if (role === "agent") return "Agente";
  return "Cliente";
}

function InfoRow({ label, value }: Field) {
  return (
    <div className="grid gap-1 border-b border-border/70 py-2 last:border-b-0 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function InfoSection({ section }: { section: FieldSection }) {
  const isCompanyDetailsSection = section.title === "Detalhes da empresa";

  return (
    <section className="border-t border-border pt-5 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
      <dl className={cn("mt-2", isCompanyDetailsSection && "grid gap-x-6 md:grid-cols-2")}>
        {section.fields.map((field) => (
          <InfoRow key={`${section.title}-${field.label}`} {...field} />
        ))}
      </dl>
    </section>
  );
}

function OrganizationOverviewCard({ tenantInfo, onEdit }: { tenantInfo: TenantInfo; onEdit: () => void }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted/40">
          <Building2 className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        </div>

        <div className="min-w-0 space-y-2">
          <h2 className="break-words text-2xl font-bold leading-tight text-foreground">
            {getOrganizationDisplayName(tenantInfo.name)}
          </h2>

          <p className="text-sm text-muted-foreground">
            Cliente desde{" "}
            <span className="font-medium text-foreground">
              {getOrganizationCustomerSinceLabel(tenantInfo.created_at)}
            </span>
          </p>
        </div>
      </div>

      <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 md:w-auto" onClick={onEdit}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Editar
      </Button>
    </div>
  );
}

function ProfileContactCard() {
  const { user } = useAuth();
  const { isOpen, isLoading, hasOtherUsers, description, openDialog, handleOpenChange, handleConfirmExit } =
    useTenantExitConfirmation();
  const fullName = [user?.name, user?.last_name].filter(Boolean).join(" ").trim() || "-";
  const email = user?.email?.trim() || "-";
  const phone = user?.phone?.trim() || "-";
  const roleLabel = getRoleLabel(user?.role);

  return (
    <section className="w-full rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Informacoes de contato do perfil</h2>
          <p className="mt-1 text-sm text-muted-foreground">Dados do usuario autenticado nesta organizacao.</p>
        </div>

        <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 md:w-auto" onClick={openDialog}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sair
        </Button>
      </div>

      <dl className="mt-5 grid gap-x-6 md:grid-cols-2">
        <InfoRow label="Nome" value={fullName} />
        <InfoRow label="Funcao" value={roleLabel} />
        <InfoRow label="Email" value={email} />
        <InfoRow label="Telefone" value={phone} />
      </dl>

      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {hasOtherUsers ? "Confirmar saida da empresa" : "Saida nao permitida agora"}
            </AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            {hasOtherUsers ? (
              <AlertDialogAction onClick={handleConfirmExit} disabled={isLoading}>
                Confirmar saida
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function OrganizationInformationPanel({
  tenantInfo,
  sections,
  onEdit,
}: {
  tenantInfo: TenantInfo;
  sections: FieldSection[];
  onEdit: () => void;
}) {
  return (
    <div className="space-y-4">
      <section className="w-full space-y-5 rounded-xl border border-border bg-card p-4 sm:p-6">
        <OrganizationOverviewCard tenantInfo={tenantInfo} onEdit={onEdit} />

        <div className="space-y-5 border-t border-border pt-5">
          {sections.map((section) => (
            <InfoSection key={section.title} section={section} />
          ))}
        </div>
      </section>

      <ProfileContactCard />
    </div>
  );
}

function OrganizationFinancialPanel({ sections }: { sections: FieldSection[] }) {
  const billingSection = sections[0];
  const supportSection = billingSection
    ? {
        ...billingSection,
        fields: billingSection.fields.filter(
          (field) => !["Metodo", "Cartao", "Vencimento"].includes(field.label)
        ),
      }
    : undefined;

  return (
    <div className="space-y-4">
      <PaymentMethodSection section={billingSection} />

      {supportSection && supportSection.fields.length > 0 ? (
        <div className="w-full space-y-5 rounded-lg border border-border bg-card p-4 sm:p-6">
          <InfoSection section={supportSection} />
        </div>
      ) : null}

      <BillingHistoryPlaceholder />
    </div>
  );
}

function PaymentMethodSection({ section }: { section?: FieldSection }) {
  const method = section?.fields.find((field) => field.label === "Metodo")?.value ?? "-";
  const card = section?.fields.find((field) => field.label === "Cartao")?.value ?? "-";
  const expiry = section?.fields.find((field) => field.label === "Vencimento")?.value ?? "-";
  const email = section?.fields.find((field) => field.label === "Email")?.value ?? "-";

  const visual = getPaymentMethodVisual({ method, card, expiry, email });
  const Icon = visual.icon;

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Forma de pagamento</h2>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie o metodo principal usado pela empresa.</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-background p-4">
        <div className="flex items-center gap-4">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          </span>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
            <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-foreground">{visual.title}</p>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                Principal
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{visual.subtitle}</p>
          </div>

          <Button type="button" variant="ghost" size="icon" className="shrink-0" disabled aria-label="Mais opcoes">
            <MoreVertical className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function getPaymentMethodVisual({
  method,
  card,
  expiry,
  email,
}: {
  method: string;
  card: string;
  expiry: string;
  email: string;
}) {
  if (method === "Pix") {
    return {
      icon: QrCode,
      title: "Pix",
      subtitle: email !== "-" ? email : "Pagamento instantaneo configurado",
    };
  }

  if (method === "Boleto") {
    return {
      icon: Landmark,
      title: "Boleto bancario",
      subtitle: email !== "-" ? email : "Cobranca por boleto configurada",
    };
  }

  return {
    icon: CreditCard,
    title: card !== "-" ? card : "Cartao de credito",
    subtitle: expiry !== "-" ? `Expira em ${expiry}` : "Sem vencimento informado",
  };
}

function PlanCardItem({ plan, currentPlan }: { plan: PlanCard; currentPlan: string }) {
  const isCurrentPlan = currentPlan === plan.key;

  return (
    <div
      className={cn(
        "relative flex min-h-[240px] flex-col rounded-lg border bg-card p-4",
        isCurrentPlan ? "border-primary ring-1 ring-primary" : "border-border"
      )}
    >
      {isCurrentPlan ? (
        <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-primary" aria-hidden="true" />
      ) : null}

      <div className="pr-7">
        <p className="text-sm font-semibold text-foreground">{plan.name}</p>
        <p className="mt-1 text-2xl font-bold tracking-normal text-foreground">{plan.priceLabel}</p>
      </div>

      <ul className="mt-4 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button type="button" variant={isCurrentPlan ? "outline" : "default"} className="mt-auto w-full" disabled>
        {isCurrentPlan ? "Plano atual" : "Alterar plano"}
      </Button>
    </div>
  );
}

function BillingHistoryPlaceholder() {
  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold text-foreground">Historico de cobranca</h2>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-3 py-4 last:border-b-0 sm:grid-cols-[auto_minmax(0,1fr)_140px_120px_auto] sm:px-4"
          >
            <span className="flex h-10 w-8 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
              PDF
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">Fatura pendente</p>
              <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">Sem dados cadastrados</p>
            </div>
            <span className="hidden text-sm text-muted-foreground sm:block">Sem data</span>
            <span className="hidden text-sm font-medium text-muted-foreground sm:block">-</span>
            <Button type="button" variant="ghost" size="icon" disabled aria-label="Baixar fatura">
              <Download className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrganizationPlanPanel({ tenantInfo }: { tenantInfo: TenantInfo }) {
  const currentPlan = normalizePlan(tenantInfo.plan);

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_CARDS.map((plan) => (
          <PlanCardItem key={plan.key} plan={plan} currentPlan={currentPlan} />
        ))}
      </div>
    </div>
  );
}

export function OrganizationTabs({ tenantInfo, profileSections, billingSections, onEdit }: OrganizationTabsProps) {
  return (
    <Tabs defaultValue="informacoes" className="flex min-h-full flex-col">
      <TabsList className="flex h-auto w-full flex-row flex-nowrap items-center justify-start gap-2 overflow-x-auto rounded-none bg-transparent p-0 text-muted-foreground">
        <TabsTrigger
          value="informacoes"
          className="h-auto min-w-[96px] rounded-md bg-transparent px-2.5 py-2.5 text-center text-sm font-normal text-muted-foreground shadow-none transition-colors hover:bg-accent hover:text-foreground sm:min-w-[110px] sm:px-3 data-[state=active]:bg-primary/10 data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-foreground dark:data-[state=active]:hover:bg-gray-800 dark:data-[state=active]:hover:text-foreground"
        >
          Informacoes
        </TabsTrigger>
        <TabsTrigger
          value="financeiro"
          className="h-auto min-w-[96px] rounded-md bg-transparent px-2.5 py-2.5 text-center text-sm font-normal text-muted-foreground shadow-none transition-colors hover:bg-accent hover:text-foreground sm:min-w-[110px] sm:px-3 data-[state=active]:bg-primary/10 data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-foreground dark:data-[state=active]:hover:bg-gray-800 dark:data-[state=active]:hover:text-foreground"
        >
          Financeiro
        </TabsTrigger>
        <TabsTrigger
          value="plano"
          className="h-auto min-w-[96px] rounded-md bg-transparent px-2.5 py-2.5 text-center text-sm font-normal text-muted-foreground shadow-none transition-colors hover:bg-accent hover:text-foreground sm:min-w-[110px] sm:px-3 data-[state=active]:bg-primary/10 data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-foreground dark:data-[state=active]:hover:bg-gray-800 dark:data-[state=active]:hover:text-foreground"
        >
          Plano
        </TabsTrigger>
      </TabsList>

      <TabsContent value="informacoes" className="mt-5 min-h-0">
        <OrganizationInformationPanel tenantInfo={tenantInfo} sections={profileSections} onEdit={onEdit} />
      </TabsContent>

      <TabsContent value="financeiro" className="mt-5 min-h-0">
        <OrganizationFinancialPanel sections={billingSections} />
      </TabsContent>

      <TabsContent value="plano" className="mt-5 min-h-0">
        <OrganizationPlanPanel tenantInfo={tenantInfo} />
      </TabsContent>
    </Tabs>
  );
}
