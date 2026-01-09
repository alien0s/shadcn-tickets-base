import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Check, Trash2, Upload } from "lucide-react";
import { EntitySelect } from "./EntitySelect";
import { ProfileField } from "./ProfileField";
import type { ProfileSectionProps } from "../types";

function LabeledInput({
  inputId,
  children,
}: {
  inputId: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2" aria-label={inputId}>
      {children}
    </div>
  );
}

export function ProfileSection({
  entities,
  selectedEntity,
  onChangeEntity,
}: ProfileSectionProps) {
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
            <Input id="firstName" defaultValue="Alex" placeholder="Primeiro nome" />
            <Input id="lastName" defaultValue="Jackson" placeholder="Sobrenome" />
          </div>
        </ProfileField>

        <ProfileField
          title="Email"
          description="Defina como entrar em contato com voce."
        >
          <div className="grid gap-4">
            <LabeledInput inputId="email">
              <Input id="email" type="email" defaultValue="finalui@yandex.com" />
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
