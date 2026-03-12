import { useCallback } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
  Monitor,
  Settings,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { cn } from "@/lib/utils";
import type { UserNavProps } from "../types";

type ThemeValue = "light" | "dark" | "system";

function isThemeValue(value: string): value is ThemeValue {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * Gera iniciais do nome do usuário para fallback do avatar
 * Ex: "João Silva" → "JS"
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function UserNav({
  isCollapsed,
  theme,
  setTheme,
  onNavigateSettings,
}: UserNavProps) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();  // ← PEGA DADOS DO USUÁRIO

  // Fallbacks para dados do usuário
  const userName = user?.name || "Usuário"
  const userEmail = user?.email || "email@exemplo.com"
  const userAvatar = user?.avatar_url || undefined
  const userInitials = getInitials(userName)

  const handleLogout = useCallback(async () => {
    try {
      await Promise.resolve(logout());
    } finally {
      navigate("/login");
    }
  }, [logout, navigate]);

  const handleThemeChange = useCallback(
    (value: string) => {
      if (!isThemeValue(value)) return;
      setTheme(value);
    },
    [setTheme]
  );

  const handleNavigateSettings = useCallback(
    (event: Event) => {
      event.preventDefault();
      onNavigateSettings();
    },
    [onNavigateSettings]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "w-full justify-start h-auto py-2 px-1.5 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
            isCollapsed && "hover:bg-transparent"
          )}
          aria-label="Abrir menu do usuário"
        >
          <div className="flex items-center gap-2 w-full">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={userAvatar}
                alt={userName}
              />
              <AvatarFallback className="rounded-lg">
                {userInitials}
              </AvatarFallback>
            </Avatar>

            {!isCollapsed && (
              <div className="flex flex-col items-start flex-1 text-left">
                <span className="text-sm font-semibold">{userName}</span>
                <span className="text-xs text-muted-foreground truncate w-32">
                  {userEmail}
                </span>
              </div>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56"
        align="end"
        side={isCollapsed ? "right" : "top"}
        sideOffset={isCollapsed ? 10 : 0}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="rounded-lg">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{userName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {userEmail}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
            Upgrade to Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={handleNavigateSettings}>
            <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
            Configurações
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleNavigateSettings}>
            <BadgeCheck className="mr-2 h-4 w-4" aria-hidden="true" />
            Perfil
          </DropdownMenuItem>

          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
            Billing
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" aria-hidden="true" />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Tema
        </DropdownMenuLabel>

        <Tabs value={theme} onValueChange={handleThemeChange}>
          <TabsList className="h-8 rounded-lg bg-muted p-1 w-full">
            <TabsTrigger
              value="system"
              className="h-6 text-xs px-2 rounded-md flex-1"
            >
              <Monitor className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Sistema
            </TabsTrigger>

            <TabsTrigger
              value="light"
              className="h-6 text-xs px-2 rounded-md flex-1"
            >
              <Sun className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Dia
            </TabsTrigger>

            <TabsTrigger
              value="dark"
              className="h-6 text-xs px-2 rounded-md flex-1"
            >
              <Moon className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Noite
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
