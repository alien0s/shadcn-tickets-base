import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { TicketsPage } from "@/pages/TicketsPage";
import { DashboardTicketsPage } from "@/pages/DashboardTicketsPage";
import { HelpCenterPage } from "@/pages/HelpCenterPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { UsersPage } from "@/pages/users/UsersPage";
import { LoginPage } from "@/pages/LoginPage";
import { ForgotPasswordPage } from "@/features/auth";
import { useAppViewport } from "@/hooks/useAppViewport";
import { useIsApplePlatform } from "@/hooks/useIsApplePlatform";
import { Toaster } from "@/components/ui/sonner";

type UserRole = "admin" | "agent" | "client";

// TODO: futuramente vem do login / API llllll
const currentUserRole: UserRole = "agent";

export default function App() {
  const initialPath = currentUserRole === "client" ? "/tickets" : "/dashboardtickets";
  useAppViewport();
  const isApplePlatform = useIsApplePlatform();

  useEffect(() => {
    if (!isApplePlatform) {
      document.documentElement.classList.add("font-inter");
    }
  }, [isApplePlatform]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={initialPath} replace />} />
      <Route path="/dashboardtickets" element={<DashboardTicketsPage />} />
      <Route path="/tickets" element={<TicketsPage />} />
      <Route path="/help-center" element={<HelpCenterPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/users" element={<UsersPage />} />
        {/* fallback */}
        <Route path="*" element={<Navigate to={initialPath} replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
