import type { TenantInfo } from "@ticket-system/types";

export type Field = {
  label: string;
  value: string;
};

export type FieldSection = {
  title: string;
  fields: Field[];
};

export type PlanCard = {
  key: string;
  name: string;
  priceLabel: string;
  features: string[];
};

export const PLAN_CARDS: PlanCard[] = [
  {
    key: "free",
    name: "Free",
    priceLabel: "R$ 0/mes",
    features: ["Acesso inicial", "Cadastro basico", "1 usuario administrador", "Suporte por tickets"],
  },
  {
    key: "basic",
    name: "Basic",
    priceLabel: "A definir",
    features: ["Grade escolar", "Matriz curricular", "Gestao de professores", "Relatorios operacionais"],
  },
  {
    key: "pro",
    name: "Pro",
    priceLabel: "A definir",
    features: ["Multiescolas", "RH e tickets de aula", "Automacoes de cobranca", "Suporte prioritario"],
  },
];

function emptyValue(value?: string | null): string {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : "-";
}

function onlyDigits(value?: string | null): string {
  return String(value ?? "").replace(/\D/g, "");
}

function formatCnpj(value?: string | null): string {
  const digits = onlyDigits(value);
  if (digits.length !== 14) return emptyValue(value);
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatPhone(value?: string | null): string {
  const digits = onlyDigits(value);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return emptyValue(value);
}

function formatZipCode(value?: string | null): string {
  const digits = onlyDigits(value);
  if (digits.length !== 8) return emptyValue(value);
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatPaymentMethod(value?: string | null): string {
  const paymentMethod = emptyValue(value);
  if (paymentMethod === "credit_card") return "Cartao de credito";
  if (paymentMethod === "boleto") return "Boleto";
  if (paymentMethod === "pix") return "Pix";
  return paymentMethod;
}

function formatCard(tenantInfo: TenantInfo): string {
  const billing = tenantInfo.billing;
  if (!billing?.card_last_four) return "-";

  const brand = emptyValue(billing.card_brand);
  return brand === "-" ? `**** ${billing.card_last_four}` : `${brand} **** ${billing.card_last_four}`;
}

function formatCardExpiry(tenantInfo: TenantInfo): string {
  const billing = tenantInfo.billing;
  if (!billing?.card_expiry_month || !billing.card_expiry_year) return "-";

  return `${String(billing.card_expiry_month).padStart(2, "0")}/${billing.card_expiry_year}`;
}

export function normalizePlan(value?: string | null): string {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized || "basic";
}

export function getPlanLabel(value?: string | null): string {
  const plan = normalizePlan(value);
  const knownPlan = PLAN_CARDS.find((item) => item.key === plan);
  return knownPlan?.name ?? emptyValue(value);
}

export function getOrganizationStatusLabel(tenantInfo: TenantInfo): string {
  return tenantInfo.active === false ? "Inativa" : "Ativa";
}

export function getOrganizationDisplayName(value?: string | null): string {
  return emptyValue(value);
}

export function getOrganizationCustomerSinceLabel(value?: string | null): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function buildProfileSections(tenantInfo: TenantInfo): FieldSection[] {
  return [
    {
      title: "Detalhes da empresa",
      fields: [
        { label: "CNPJ", value: formatCnpj(tenantInfo.profile?.cnpj) },
        { label: "Telefone", value: formatPhone(tenantInfo.profile?.phone) },
        { label: "Email", value: emptyValue(tenantInfo.profile?.email) },
        { label: "Endereço", value: emptyValue(tenantInfo.profile?.address) },
        { label: "Cidade", value: emptyValue(tenantInfo.profile?.city) },
        { label: "Estado", value: emptyValue(tenantInfo.profile?.state) },
        { label: "CEP", value: formatZipCode(tenantInfo.profile?.zip_code) },
      ],
    },
  ];
}

export function buildBillingSections(tenantInfo: TenantInfo): FieldSection[] {
  return [
    {
      title: "Configuracoes de cobranca",
      fields: [
        { label: "Email", value: emptyValue(tenantInfo.billing?.billing_email) },
        { label: "Titular", value: emptyValue(tenantInfo.billing?.card_holder_name) },
        { label: "Metodo", value: formatPaymentMethod(tenantInfo.billing?.payment_method) },
        { label: "Cartao", value: formatCard(tenantInfo) },
        { label: "Vencimento", value: formatCardExpiry(tenantInfo) },
        { label: "Criado em", value: formatDate(tenantInfo.billing?.created_at) },
        { label: "Atualizado em", value: formatDate(tenantInfo.billing?.updated_at) },
      ],
    },
  ];
}
