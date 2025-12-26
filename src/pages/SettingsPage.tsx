import { useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "@/context/sidebar-context";
import { Sidebar } from "@/layout/Sidebar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Check,
  Edit3,
  PanelRight,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const settingsSections = [
  { id: "general", label: "Perfil" },
  { id: "security", label: "Segurança" },
  { id: "appearance", label: "Aparência" },
];

export function SettingsPage() {
  return (
    <SidebarProvider>
      <div className="h-screen w-screen bg-background text-foreground flex">
        <Sidebar />
        <SettingsShell />
      </div>
    </SidebarProvider>
  );
}

function SettingsShell() {
  const { toggleSidebar } = useSidebar();
  const [activeSection, setActiveSection] = useState("general");
  const [entities, setEntities] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>("ANRA");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  useEffect(() => {
    const fetchEntities = async () => {
      const fakeApiData = ["ANRA", "ACeAm", "Asur", "MLA", "UNoB"];
      await new Promise((resolve) => setTimeout(resolve, 180));
      setEntities(fakeApiData);
      if (!fakeApiData.includes(selectedEntity)) {
        setSelectedEntity(fakeApiData[0]);
      }
    };
    fetchEntities();
  }, [selectedEntity]);

  const renderContent = () => {
    if (activeSection === "general") {
      return (
        <ProfileSection
          entities={entities}
          selectedEntity={selectedEntity}
          onChangeEntity={setSelectedEntity}
        />
      );
    }
    if (activeSection === "security") {
      return (
        <SecuritySection
          twoFactorEnabled={twoFactorEnabled}
          onToggleTwoFactor={setTwoFactorEnabled}
        />
      );
    }
    return <PlaceholderSection title={settingsSections.find((s) => s.id === activeSection)?.label || "Em breve"} />;
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="h-14 border-b border-border flex items-center">
        <div className="mx-auto max-w-6xl w-full flex items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={toggleSidebar}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Configuracões</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[230px,1fr] items-start md:items-stretch">
            <nav className="md:pr-6 md:border-r md:border-border md:self-stretch">
              <div className="py-1 flex gap-2 overflow-x-auto md:flex-col md:space-y-1 md:overflow-visible">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    className={cn(
                      "flex items-center justify-center md:justify-start rounded-md px-2.5 sm:px-3 py-2.5 text-sm transition-colors whitespace-nowrap text-center md:text-left",
                      "min-w-[96px] sm:min-w-[110px] md:min-w-0",
                      "hover:bg-accent hover:text-foreground",
                      activeSection === section.id
                        ? "sidebar-nav-active hover:bg-primary/10 hover:text-primary dark:hover:bg-gray-800 dark:hover:text-foreground"
                        : "text-muted-foreground"
                    )}
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </nav>

            <section className="flex flex-col">{renderContent()}</section>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProfileSection({
  entities,
  selectedEntity,
  onChangeEntity,
}: {
  entities: string[];
  selectedEntity: string;
  onChangeEntity: (val: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-4 border-b border-border px-1 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16 rounded-xl">
            <AvatarImage
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU6TAn8zOX5VYek6Hq0ToTCdAbi0cyjHVQ8g&s"
              alt="Avatar"
            />
            <AvatarFallback className="rounded-xl text-lg font-semibold">
              AJ
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-base font-semibold">Alex Jackson</p>
            <p className="text-sm text-muted-foreground">
              Atualize a foto e os dados usados no perfil.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Trash2 className="h-4 w-4" />
            Remover
          </Button>
          <Button size="sm" className="gap-1.5">
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border">
        <ProfileField
          title="Nome"
          description="Nome exibido para clientes e equipe."
          align="center"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="firstName"
              defaultValue="Alex"
              placeholder="Primeiro nome"
            />
            <Input
              id="lastName"
              defaultValue="Jackson"
              placeholder="Sobrenome"
            />
          </div>
        </ProfileField>

        <ProfileField
          title="Email"
          description="Defina como entrar em contato com voce."
        >
          <div className="grid gap-4">
            <LabeledInput inputId="email">
              <Input
                id="email"
                type="email"
                defaultValue="finalui@yandex.com"
              />
            </LabeledInput>
          </div>
        </ProfileField>

        <ProfileField
          title="Entidade"
          description="Organizacao vinculada ao seu perfil."
        >
          <LabeledInput inputId="entity">
            <EntitySelect
              options={entities}
              value={selectedEntity}
              onChange={onChangeEntity}
            />
          </LabeledInput>
        </ProfileField>
      </div>

      <Separator />

      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Revise antes de salvar para manter o perfil atualizado.
        </div>
        <Button className="gap-2" size="sm">
          <Check className="h-4 w-4" />
          Salvar alteracoes
        </Button>
      </div>
    </>
  );
}

function SecuritySection({
  twoFactorEnabled,
  onToggleTwoFactor,
}: {
  twoFactorEnabled: boolean;
  onToggleTwoFactor: (val: boolean) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-2 border-b border-border px-1 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
        <div className="space-y-1">
          <p className="text-base font-semibold">Seguranca</p>
          <p className="text-sm text-muted-foreground">
            Gerencie a senha e ative camadas extras de protecao.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Ultima revisao de seguranca ha 30 dias.
        </div>
      </div>

      <div className="divide-y divide-border">
        <ProfileField
          title="Senha"
          description="Troque a senha regularmente para manter a conta protegida."
        >
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-3 sm:px-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-[0.2rem]">••••••••</p>
              <p className="text-xs text-muted-foreground">
                Ultima alteracao ha 3 meses.
              </p>
            </div>
            <Button variant="outline" size="icon" aria-label="Editar senha">
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        </ProfileField>

        <ProfileField
          title="Autenticacao em duas etapas"
          description="Exige um segundo fator ao entrar para evitar acessos indevidos."
        >
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-3 sm:px-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                    twoFactorEnabled
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {twoFactorEnabled ? "Ativada" : "Desativada"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Receba um codigo no email ao fazer login.
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={onToggleTwoFactor}
            />
          </div>
        </ProfileField>
      </div>
    </>
  );
}

function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-3 p-6 border border-dashed border-border rounded-xl bg-muted/20">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">Conteudo em breve.</p>
    </div>
  );
}

function ProfileField({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  align?: "start" | "center";
}) {
  return (
    <div
      className={[
        "flex flex-col gap-3 py-4 sm:flex-row sm:gap-6 sm:items-center",
      ].join(" ")}
    >
      <div className="w-full sm:w-[200px]">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex-1 space-y-3">{children}</div>
    </div>
  );
}

function LabeledInput({
  inputId,
  children,
}: {
  inputId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2" aria-label={inputId}>
      {children}
    </div>
  );
}

function EntitySelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between px-3">
          <span className="truncate">
            {value || "Selecione uma entidade"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[220px]" align="start">
        <div className="py-1">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-foreground",
                option === value ? "font-semibold" : "font-normal"
              )}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              <span className="flex items-center gap-2">
                <Check
                  className={cn(
                    "h-4 w-4",
                    option === value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">{option}</span>
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
