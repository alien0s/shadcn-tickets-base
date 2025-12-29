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
import { useTheme } from "@/context/theme-context";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserNavProps {
  isCollapsed: boolean;
}

export function UserNav({ isCollapsed }: UserNavProps) {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={[
            "w-full justify-start h-auto py-2 px-1.5",
            isCollapsed ? "hover:bg-transparent" : "",
          ].join(" ")}
        >
          <div className="flex items-center gap-2 w-full">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU6TAn8zOX5VYek6Hq0ToTCdAbi0cyjHVQ8g&s"
                alt="User"
              />
              <AvatarFallback className="rounded-lg">CN</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col items-start flex-1 text-left">
                <span className="text-sm font-semibold">shadcn</span>
                <span className="text-xs text-muted-foreground truncate w-32">
                  m@example.com
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
              <AvatarImage src="/placeholder-user.png" alt="User" />
              <AvatarFallback className="rounded-lg">CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">shadcn</span>
              <span className="truncate text-xs text-muted-foreground">
                m@example.com
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              navigate("/settings");
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configuracoes
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BadgeCheck className="mr-2 h-4 w-4" />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Tema
        </DropdownMenuLabel>
        <Tabs
          value={theme}
          onValueChange={(value) =>
            setTheme(value as "light" | "dark" | "system")
          }
        >
          <TabsList className="h-8 rounded-lg bg-muted p-1 w-full">
            <TabsTrigger value="system" className="h-6 text-xs px-2 rounded-md flex-1">
              <Monitor className="h-3.5 w-3.5 mr-1.5" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="light" className="h-6 text-xs px-2 rounded-md flex-1">
              <Sun className="h-3.5 w-3.5 mr-1.5" />
              Dia
            </TabsTrigger>
            <TabsTrigger value="dark" className="h-6 text-xs px-2 rounded-md flex-1">
              <Moon className="h-3.5 w-3.5 mr-1.5" />
              Noite
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
