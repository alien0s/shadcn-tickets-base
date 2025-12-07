import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout"; // sua tela de tickets
// crie essas duas páginas simples por enquanto
import { DashboardPage } from "@/pages/DashboardPage";
import { HelpCenterPage } from "@/pages/HelpCenterPage";

type UserRole = "admin" | "agent" | "client";

// TODO: futuramente vem do login / API
const currentUserRole: UserRole = "agent";

export default function App() {
  const initialPath = currentUserRole === "client" ? "/tickets" : "/dashboard";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={initialPath} replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/tickets" element={<AppLayout />} />
      <Route path="/help-center" element={<HelpCenterPage />} />
      {/* fallback */}
      <Route path="*" element={<Navigate to={initialPath} replace />} />
    </Routes>
  );
}
