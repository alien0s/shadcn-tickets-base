import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Check } from "lucide-react";
import type { TenantInfo } from "@ticket-system/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileField } from "@/features/settings/components/ProfileField";

export type EditOrganizationFormValues = {
  name: string;
  slug: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  billingEmail: string;
  paymentMethod: string;
};

type EditOrganizationDialogProps = {
  open: boolean;
  tenantInfo: TenantInfo;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EditOrganizationFormValues) => void | Promise<void>;
};

function onlyDigits(value?: string | null): string {
  return String(value ?? "").replace(/\D/g, "");
}

function formatCnpj(value?: string | null): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatPhone(value?: string | null): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatZipCode(value?: string | null): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function buildFormValues(tenantInfo: TenantInfo): EditOrganizationFormValues {
  return {
    name: tenantInfo.name ?? "",
    slug: tenantInfo.slug ?? "",
    cnpj: formatCnpj(tenantInfo.profile?.cnpj),
    phone: formatPhone(tenantInfo.profile?.phone),
    email: tenantInfo.profile?.email ?? "",
    address: tenantInfo.profile?.address ?? "",
    city: tenantInfo.profile?.city ?? "",
    state: tenantInfo.profile?.state ?? "",
    zipCode: formatZipCode(tenantInfo.profile?.zip_code),
    billingEmail: tenantInfo.billing?.billing_email ?? "",
    paymentMethod: tenantInfo.billing?.payment_method ?? "credit_card",
  };
}

export function EditOrganizationDialog({
  open,
  tenantInfo,
  onOpenChange,
  onSubmit,
}: EditOrganizationDialogProps) {
  const initialValues = useMemo(() => buildFormValues(tenantInfo), [tenantInfo]);
  const [formValues, setFormValues] = useState<EditOrganizationFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFormValues(initialValues);
    setIsSubmitting(false);
  }, [initialValues, open]);

  const isDirty = useMemo(
    () => JSON.stringify(formValues) !== JSON.stringify(initialValues),
    [formValues, initialValues]
  );

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    setFormValues((current) => {
      if (name === "cnpj") return { ...current, cnpj: formatCnpj(value) };
      if (name === "phone") return { ...current, phone: formatPhone(value) };
      if (name === "zipCode") return { ...current, zipCode: formatZipCode(value) };
      if (name === "state") return { ...current, state: value.toUpperCase().slice(0, 2) };
      return { ...current, [name]: value };
    });
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!isDirty || isSubmitting) return;

      setIsSubmitting(true);
      try {
        await onSubmit({
          ...formValues,
          cnpj: onlyDigits(formValues.cnpj),
          phone: onlyDigits(formValues.phone),
          zipCode: onlyDigits(formValues.zipCode),
          slug: formValues.slug.trim().toLowerCase(),
          state: formValues.state.trim().toUpperCase(),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formValues, isDirty, isSubmitting, onSubmit]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col overflow-hidden rounded-none p-4 sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-[760px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:p-6">
        <DialogHeader>
          <DialogTitle>Editar organização</DialogTitle>
          <DialogDescription>Atualize os dados cadastrais e de contato da empresa.</DialogDescription>
        </DialogHeader>

        <form className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-4">
            <div className="divide-y divide-border">
              <ProfileField title="Empresa" description="Nome e identificador usados na organização.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input name="name" value={formValues.name} placeholder="Nome da empresa" onChange={handleChange} />
                  <div className="flex w-full">
                    <Input
                      name="slug"
                      value={formValues.slug}
                      placeholder="slug-da-empresa"
                      onChange={handleChange}
                      className="rounded-r-none border-r-0"
                    />
                    <div className="flex h-10 shrink-0 items-center rounded-r-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                      thurnos.com
                    </div>
                  </div>
                </div>
              </ProfileField>

              <ProfileField title="CNPJ" description="Documento fiscal da empresa.">
                <div className="grid gap-4">
                  <Input name="cnpj" value={formValues.cnpj} placeholder="00.000.000/0001-00" onChange={handleChange} />
                </div>
              </ProfileField>

              <ProfileField title="Contato" description="Dados comerciais da empresa.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input name="phone" value={formValues.phone} placeholder="(00) 00000-0000" onChange={handleChange} />
                  <Input name="email" type="email" value={formValues.email} placeholder="empresa@email.com" onChange={handleChange} />
                </div>
              </ProfileField>

              <ProfileField title="Endereço" description="Localização fiscal ou comercial.">
                <div className="grid gap-4">
                  <Input name="address" value={formValues.address} placeholder="Endereço" onChange={handleChange} />
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_90px_140px]">
                    <Input name="city" value={formValues.city} placeholder="Cidade" onChange={handleChange} />
                    <Input name="state" value={formValues.state} placeholder="UF" maxLength={2} onChange={handleChange} />
                    <Input name="zipCode" value={formValues.zipCode} placeholder="00000-000" onChange={handleChange} />
                  </div>
                </div>
              </ProfileField>

              <ProfileField title="Cobrança" description="Preferências de cobrança da empresa.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    name="billingEmail"
                    type="email"
                    value={formValues.billingEmail}
                    placeholder="cobranca@email.com"
                    onChange={handleChange}
                  />
                  <select
                    name="paymentMethod"
                    value={formValues.paymentMethod}
                    onChange={handleChange}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="credit_card">Cartão de crédito</option>
                    <option value="boleto">Boleto</option>
                    <option value="pix">Pix</option>
                  </select>
                </div>
              </ProfileField>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 bg-background pt-4 sm:justify-end sm:space-x-0">
            <Button type="button" variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="flex-1 gap-1.5 sm:flex-none" disabled={!isDirty || isSubmitting}>
              <Check className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
