import React, { createContext, useContext, useState, useEffect } from "react";

type SidebarContextValue = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Detecta se é mobile e inicia collapsed em mobile; mantém a última escolha quando possível
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored !== null) {
        return stored === "true";
      }
      return window.innerWidth < 768; // md breakpoint
    }
    return false;
  });

  // Atualiza collapsed quando resize para mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
        localStorage.setItem("sidebar-collapsed", "true");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function toggleSidebar() {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebar-collapsed", String(next));
      }
      return next;
    });
  }

  function closeSidebar() {
    setIsCollapsed((prev) => {
      if (!prev && typeof window !== "undefined") {
        localStorage.setItem("sidebar-collapsed", "true");
      }
      return true;
    });
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
