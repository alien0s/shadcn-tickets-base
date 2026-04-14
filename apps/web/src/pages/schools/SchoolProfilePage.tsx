import { AppLayout } from "@/layout/AppLayout";
import { useParams } from "react-router-dom";
import { SchoolProfile } from "@/features/schools";

export function SchoolProfilePage() {
  const { schoolId } = useParams<{ schoolId: string }>();

  return (
    <AppLayout>
      <SchoolProfile schoolId={schoolId ?? null} />
    </AppLayout>
  );
}
