import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth";
import { useEntities } from "@/hooks/useEntities";
import { toTenantSlug } from "@/features/tenant/utils/subdomain";

type Tenant = {
  id: string;
  name: string;
  colorClass: string;
};

type TenantsDropdownProps = {
  collapsed: boolean;
};

export function TenantsDropdown({ collapsed }: TenantsDropdownProps) {
  const { user, updateUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const isRoot = user?.role === "root";
  const { entities } = useEntities(isRoot);

  const tenantColors = useMemo(
    () => [
      "bg-blue-500",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-violet-500",
      "bg-rose-500",
      "bg-cyan-500",
    ],
    []
  );

  const userTenantId = user?.tenant_id ?? user?.entity_id ?? "";
  const userTenantName = user?.tenant_name ?? user?.tenant_slug ?? (userTenantId ? `Tenant ${userTenantId.slice(0, 8)}` : "Sem tenant");

  const tenants = useMemo<Tenant[]>(() => {
    if (isRoot) {
      return entities.map((entity, index) => ({
        id: entity.id,
        name: entity.name,
        colorClass: tenantColors[index % tenantColors.length],
      }));
    }

    if (!userTenantId) return [];
    return [
      {
        id: userTenantId,
        name: userTenantName,
        colorClass: "bg-blue-500",
      },
    ];
  }, [entities, isRoot, tenantColors, userTenantId, userTenantName]);

  useEffect(() => {
    if (tenants.length === 0) {
      setSelectedTenantId("");
      return;
    }

    if (selectedTenantId && tenants.some((tenant) => tenant.id === selectedTenantId)) {
      return;
    }

    if (!isRoot && userTenantId) {
      setSelectedTenantId(userTenantId);
      return;
    }

    setSelectedTenantId(tenants[0].id);
  }, [isRoot, selectedTenantId, tenants, userTenantId]);

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);

    if (!isRoot) return;

    const selected = tenants.find((tenant) => tenant.id === tenantId);
    if (!selected) return;

    updateUser({
      tenant_id: selected.id,
      entity_id: selected.id,
      tenant_name: selected.name,
      tenant_slug: toTenantSlug(selected.name),
    });
  };

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) ?? tenants[0],
    [selectedTenantId, tenants]
  );

  return (
    <div className="px-2 pt-3">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={tenants.length <= 1}
            className={cn(
              "w-full h-9",
              collapsed ? "justify-center px-2" : "justify-start px-2.5"
            )}
            aria-label="Selecionar empresa"
          >
            <span
              className={cn(
                "h-3.5 w-3.5 shrink-0 rounded-[3px] border border-border",
                selectedTenant?.colorClass
              )}
              aria-hidden="true"
            />
            {!collapsed && (
              <>
                <span className="ml-2 truncate text-sm">{selectedTenant?.name ?? "Sem empresa"}</span>
                <ChevronDown
                  className={cn(
                    "ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200",
                    open && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          {tenants.map((tenant) => {
            const isSelected = tenant.id === selectedTenantId;
            return (
              <DropdownMenuItem
                key={tenant.id}
                onSelect={() => handleSelectTenant(tenant.id)}
                className="gap-2"
              >
                <span
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 rounded-[3px] border border-border",
                    tenant.colorClass
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{tenant.name}</span>
                {isSelected && <Check className="ml-auto h-4 w-4 text-primary" aria-hidden="true" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
