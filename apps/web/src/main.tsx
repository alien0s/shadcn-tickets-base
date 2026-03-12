import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./context/theme-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@fontsource-variable/inter/wght.css";
import { AuthProvider } from "@/features/auth";
import { resolvePreRenderTenantRedirect } from "@/features/tenant/utils/pre-render-tenant-redirect";

const targetRedirectUrl = resolvePreRenderTenantRedirect(window.location);

if (targetRedirectUrl) {
  window.location.replace(targetRedirectUrl);
} else {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <App />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
