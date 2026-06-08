import type { Tenant, TenantBilling, TenantInfo, TenantProfile, UpdateTenantInfoRequest } from '@ticket-system/types'
import { supabase } from '../../config/supabase.js'
import { NotFoundError } from '../../shared/errors/AppError.js'

export class TenantRepository {
  async findInfoById(tenantId: string): Promise<TenantInfo> {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, plan, active, created_at')
      .eq('id', tenantId)
      .maybeSingle()

    if (tenantError) throw tenantError
    if (!tenant) {
      throw new NotFoundError('Empresa nao encontrada')
    }

    const [{ data: profile, error: profileError }, { data: billing, error: billingError }] =
      await Promise.all([
        supabase
          .from('tenant_profiles')
          .select('id, tenant_id, cnpj, phone, email, address, city, state, zip_code, created_at, updated_at')
          .eq('tenant_id', tenantId)
          .maybeSingle(),
        supabase
          .from('tenant_billing')
          .select(
            'id, tenant_id, card_last_four, card_brand, card_holder_name, card_expiry_month, card_expiry_year, asaas_customer_id, asaas_subscription_id, payment_method, billing_email, created_at, updated_at'
          )
          .eq('tenant_id', tenantId)
          .maybeSingle()
      ])

    if (profileError) throw profileError
    if (billingError) throw billingError

    return {
      ...(tenant as Tenant),
      profile: (profile as TenantProfile | null) ?? null,
      billing: (billing as TenantBilling | null) ?? null
    }
  }

  async updateInfo(tenantId: string, payload: UpdateTenantInfoRequest): Promise<TenantInfo> {
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({
        name: payload.name,
        slug: payload.slug
      })
      .eq('id', tenantId)

    if (tenantError) throw tenantError

    if (payload.profile) {
      const { error: profileError } = await supabase
        .from('tenant_profiles')
        .upsert(
          {
            tenant_id: tenantId,
            cnpj: payload.profile.cnpj ?? null,
            phone: payload.profile.phone ?? null,
            email: payload.profile.email ?? null,
            address: payload.profile.address ?? null,
            city: payload.profile.city ?? null,
            state: payload.profile.state ?? null,
            zip_code: payload.profile.zip_code ?? null,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'tenant_id' }
        )

      if (profileError) {
        throw profileError
      }
    }

    if (payload.billing) {
      const { error: billingError } = await supabase
        .from('tenant_billing')
        .upsert(
          {
            tenant_id: tenantId,
            payment_method: payload.billing.payment_method ?? 'credit_card',
            billing_email: payload.billing.billing_email ?? null,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'tenant_id' }
        )

      if (billingError) {
        throw billingError
      }
    }

    return this.findInfoById(tenantId)
  }

  async findRoleNameById(roleId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('name')
      .eq('id', roleId)
      .single()

    if (error || !data) return null
    return String(data.name)
  }
}
