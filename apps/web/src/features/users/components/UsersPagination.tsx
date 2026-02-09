import { memo, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";

type UsersPaginationProps = {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
};

function UsersPaginationComponent({
  page,
  total,
  pageSize,
  onPageChange,
}: UsersPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Calcula se botões de navegação devem estar desabilitados
  const isPrevDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;

  // Handler para página anterior
  const handlePrevPage = useCallback(() => {
    onPageChange(page - 1);
  }, [page, onPageChange]);

  // Handler para próxima página
  const handleNextPage = useCallback(() => {
    onPageChange(page + 1);
  }, [page, onPageChange]);

  // Gera array de números de página (memoizado para evitar recriação)
  // NOTA: Para muitas páginas (>10), considere implementar ellipsis pattern
  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages]
  );

  return (
    <div className="flex items-center justify-end px-4 py-3 text-xs text-muted-foreground gap-2">
      {/* Botão "Anterior" */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevPage}
        disabled={isPrevDisabled}
      >
        Anterior
      </Button>

      {/* Botões numerados de cada página */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((pageNumber) => {
          const isActive = pageNumber === page;
          return (
            <Button
              key={pageNumber}
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              disabled={isActive}
            >
              {pageNumber}
            </Button>
          );
        })}
      </div>

      {/* Botão "Próximo" */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextPage}
        disabled={isNextDisabled}
      >
        Próximo
      </Button>
    </div>
  );
}

// Memoiza para evitar re-renders desnecessários
// Só re-renderiza quando page, totalPages ou onPageChange mudam
export const UsersPagination = memo(UsersPaginationComponent);
