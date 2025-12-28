import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./context/theme-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@fontsource-variable/inter/wght.css";

import "./index.css";

const setAppHeight = () => {
  if (typeof window === "undefined") return;
  const height = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty(
    "--app-height",
    `${Math.round(height)}px`
  );
};

setAppHeight();
window.addEventListener("resize", setAppHeight);
window.addEventListener("orientationchange", setAppHeight);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", setAppHeight);
  window.visualViewport.addEventListener("scroll", setAppHeight);
}


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

