import { Button } from "@/components/ui/button";

export function UsersPagination() {
  return (
    <div className="flex items-center justify-end px-4 py-3 text-xs text-muted-foreground gap-2">
      <Button variant="outline" size="sm">
        Previous
      </Button>
      <Button variant="outline" size="sm">
        Next
      </Button>
    </div>
  );
}
