import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { HelpCenterPage } from "@/pages/HelpCenterPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { UsersPage } from "@/pages/UsersPage";
import { useAppViewport } from "@/hooks/useAppViewport";

type UserRole = "admin" | "agent" | "client";

// TODO: futuramente vem do login / API
const currentUserRole: UserRole = "agent";

export default function App() {
  const initialPath = currentUserRole === "client" ? "/tickets" : "/dashboard";
  useAppViewport();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={initialPath} replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/tickets" element={<AppLayout />} />
      <Route path="/help-center" element={<HelpCenterPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/users" element={<UsersPage />} />
      {/* fallback */}
      <Route path="*" element={<Navigate to={initialPath} replace />} />
    </Routes>
  );
}
