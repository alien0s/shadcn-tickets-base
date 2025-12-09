import React, { createContext, useContext, useState, useEffect } from "react";

type SidebarContextValue = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Detecta se é mobile e inicia collapsed em mobile
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768; // md breakpoint
    }
    return false;
  });

  // Atualiza collapsed quando resize para mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function toggleSidebar() {
    setIsCollapsed((prev) => !prev);
  }

  function closeSidebar() {
    setIsCollapsed(true);
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
