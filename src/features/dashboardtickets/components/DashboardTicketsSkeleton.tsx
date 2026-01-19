import { Skeleton } from "@/components/ui/skeleton";

export function DashboardTicketsSkeleton() {
  return (
    <div
      className="space-y-4"
      role="status" // ✅ indica estado de carregamento
      aria-live="polite" // ✅ anuncia mudanças sem interromper
      aria-label="Carregando dados do dashboard"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index} // ✅ ok: lista fixa e apenas visual
            className="h-28 rounded-xl"
            aria-hidden="true" // ✅ skeleton não precisa ser lido
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" aria-hidden="true" />
        <Skeleton className="h-80 rounded-xl" aria-hidden="true" />
      </div>
    </div>
  );
}
