import { Button } from "@/components/ui/button";

type UsersPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
};

export function UsersPagination({
  page,
  totalPages,
  onPageChange,
}: UsersPaginationProps) {
  const isPrevDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;

  return (
    <div className="flex items-center justify-end px-4 py-3 text-xs text-muted-foreground gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={isPrevDisabled}
      >
        Anterior
      </Button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, index) => {
          const pageNumber = index + 1;
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
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={isNextDisabled}
      >
        Próximo
      </Button>
    </div>
  );
}
