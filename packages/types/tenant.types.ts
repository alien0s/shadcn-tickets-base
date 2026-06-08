export interface Tenant {
  id: string
  name: string
  slug: string
  plan?: string | null
  active?: boolean | null
  created_at?: string | null
}

export interface TenantProfile {
  id: string
  tenant_id: string
  cnpj?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface TenantBilling {
  id: string
  tenant_id: string
  card_last_four?: string | null
  card_brand?: string | null
  card_holder_name?: string | null
  card_expiry_month?: number | null
  card_expiry_year?: number | null
  asaas_customer_id?: string | null
  asaas_subscription_id?: string | null
  payment_method?: string | null
  billing_email?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface TenantInfo extends Tenant {
  profile: TenantProfile | null
  billing: TenantBilling | null
}

export interface UpdateTenantInfoRequest {
  name: string
  slug: string
  profile?: {
    cnpj?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    zip_code?: string | null
  }
  billing?: {
    payment_method?: string | null
    billing_email?: string | null
  }
}
