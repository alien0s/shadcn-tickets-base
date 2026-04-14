import { Link } from "react-router-dom";
import { PanelRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

type SchoolProfileHeaderProps = {
  breadcrumbSchoolLabel: string;
  onToggleSidebar: () => void;
};

export function SchoolProfileHeader({
  breadcrumbSchoolLabel,
  onToggleSidebar,
}: SchoolProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-h-9 items-center gap-3">
        <Button variant="outline" size="icon" className="md:hidden" onClick={onToggleSidebar}>
          <PanelRight className="h-4 w-4" />
        </Button>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/escolas">Escolas</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{breadcrumbSchoolLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
