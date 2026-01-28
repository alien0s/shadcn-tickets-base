import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Check, Trash2, Upload } from "lucide-react";
import type { UserRecord } from "../data/mockUsers";
import { getInitials } from "../utils/getInitials";
import {
  cropImage,
  ImageCropper,
  useImageCropper,
} from "@/features/ImageCropper";
import { EntitySelect } from "@/features/settings/components/EntitySelect";
import { ProfileField } from "@/features/settings/components/ProfileField";

type Props = {
  user: UserRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Opções de entidade (constante fora do componente para evitar recriação)
const ENTITY_OPTIONS = ["ANRA", "ACeAm", "Asur", "MLA", "UNoB"];

export function EditUserDialog({ user, open, onOpenChange }: Props) {
  // Estado do avatar (URL da imagem exibida)
  const [avatarSrc, setAvatarSrc] = useState(user.avatar ?? "");
  const previousAvatarUrl = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Estados do modal de crop
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isSavingCrop, setIsSavingCrop] = useState(false);

  // Hook customizado para gerenciar crop de imagem
  const {
    imageSrc,
    setImageSrc,
    cropArea,
    setCropArea,
    zoom,
    setZoom,
    loadFile,
  } = useImageCropper({ initialImage: user.avatar ?? "" });

  // Estados do formulário (valores iniciais e atuais)
  const [initialValues, setInitialValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    entity: "",
  });
  
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    entity: "",
  });

  // Controla auto-focus do dialog (desabilitado em mobile)
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);

  // Sincroniza valores do formulário quando o usuário muda
  useEffect(() => {
    const nameParts = user.name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");
    
    const nextValues = {
      firstName,
      lastName,
      email: user.email,
      entity: user.entity,
    };
    
    setInitialValues(nextValues);
    setFormValues(nextValues);
    setAvatarSrc(user.avatar ?? "");
    setImageSrc(user.avatar ?? "");
  }, [user.avatar, user.email, user.entity, user.name, setImageSrc]);

  // Gerencia limpeza de URLs blob do avatar
  useEffect(() => {
    const previous = previousAvatarUrl.current;
    
    // Libera memória de URLs blob antigas
    if (previous && previous.startsWith("blob:") && previous !== avatarSrc) {
      URL.revokeObjectURL(previous);
    }
    
    previousAvatarUrl.current = avatarSrc;
  }, [avatarSrc]);

  // Detecta se é mobile para desabilitar auto-focus
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateAutoFocus = () => setShouldAutoFocus(!mediaQuery.matches);
    
    // Define valor inicial
    updateAutoFocus();

    // Atualiza quando o tamanho da tela muda
    mediaQuery.addEventListener("change", updateAutoFocus);

    return () => {
      mediaQuery.removeEventListener("change", updateAutoFocus);
    };
  }, []);

  // Verifica se o formulário foi modificado (memoizado para evitar recálculo)
  const isDirty = useMemo(
    () =>
      formValues.firstName !== initialValues.firstName ||
      formValues.lastName !== initialValues.lastName ||
      formValues.email !== initialValues.email ||
      formValues.entity !== initialValues.entity,
    [formValues, initialValues]
  );

  // Handler para quando o usuário seleciona uma imagem
  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    loadFile(file);
    setIsCropOpen(true);
    event.target.value = ""; // Limpa input para permitir reupload do mesmo arquivo
  }, [loadFile]);

  // Abre modal de crop com a imagem atual
  const handleOpenCrop = useCallback(() => {
    if (!avatarSrc) return;
    setImageSrc(avatarSrc);
    setIsCropOpen(true);
  }, [avatarSrc, setImageSrc]);

  // Salva a imagem recortada
  const handleSaveCrop = useCallback(async () => {
    if (!imageSrc || !cropArea) return;
    
    setIsSavingCrop(true);
    try {
      const blob = await cropImage(imageSrc, cropArea);
      const nextUrl = URL.createObjectURL(blob);
      setAvatarSrc(nextUrl);
      setIsCropOpen(false);
    } finally {
      setIsSavingCrop(false);
    }
  }, [imageSrc, cropArea]);

  // Handler para atualizar firstName
  const handleFirstNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, firstName: event.target.value }));
  }, []);

  // Handler para atualizar lastName
  const handleLastNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, lastName: event.target.value }));
  }, []);

  // Handler para atualizar email
  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({ ...prev, email: event.target.value }));
  }, []);

  // Handler para atualizar entidade
  const handleEntityChange = useCallback((value: string) => {
    setFormValues((prev) => ({ ...prev, entity: value }));
  }, []);

  // Handler para abrir input de arquivo
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handler para fechar dialog
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Handler para submit do formulário
  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col h-[100dvh] max-h-[100dvh] w-full max-w-full left-0 top-0 translate-x-0 translate-y-0 rounded-none overflow-hidden p-4 min-[500px]:w-[95vw] min-[500px]:max-w-[700px] min-[500px]:left-1/2 min-[500px]:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-[700px] sm:rounded-lg sm:p-6"
        onOpenAutoFocus={(event) => {
          if (!shouldAutoFocus) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>

        <form
          className="mt-3 flex flex-col flex-1 min-h-0 gap-4 overflow-y-auto sm:overflow-visible"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4 pr-1 pl-1 flex-1 min-h-0">
            {/* Seção de avatar e informações do usuário */}
            <div className="flex flex-col gap-4 border-b border-border px-1 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl"
                  onClick={handleOpenCrop}
                  aria-label="Editar foto do usuario"
                >
                  <Avatar className="h-16 w-16 rounded-xl">
                    <AvatarImage src={avatarSrc} alt={user.name} />
                    <AvatarFallback className="rounded-xl text-lg font-semibold bg-muted/70">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <div className="space-y-1">
                  <p className="text-base font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Atualize a foto e os dados usados no perfil.
                  </p>
                </div>
              </div>

              {/* Botões de ação do avatar */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" type="button">
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  type="button"
                  onClick={handleUploadClick}
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Campos do formulário */}
            <div className="divide-y divide-border">
              {/* Campo de nome (dividido em primeiro nome e sobrenome) */}
              <ProfileField
                title="Nome"
                description="Nome exibido para clientes e equipe."
                align="center"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="firstName"
                    value={formValues.firstName}
                    placeholder="Primeiro nome"
                    onChange={handleFirstNameChange}
                  />
                  <Input
                    id="lastName"
                    value={formValues.lastName}
                    placeholder="Sobrenome"
                    onChange={handleLastNameChange}
                  />
                </div>
              </ProfileField>

              {/* Campo de email */}
              <ProfileField
                title="Email"
                description="Defina como entrar em contato com voçe."
              >
                <div className="grid gap-4">
                  <Input
                    id="email"
                    type="email"
                    value={formValues.email}
                    onChange={handleEmailChange}
                  />
                </div>
              </ProfileField>

              {/* Campo de entidade */}
              <ProfileField
                title="Entidade"
                description="Organização vinculada ao seu perfil."
              >
                <EntitySelect
                  options={ENTITY_OPTIONS}
                  value={formValues.entity}
                  onChange={handleEntityChange}
                />
              </ProfileField>
            </div>

            <Separator />

            <div className="text-sm text-muted-foreground">
              Revise antes de salvar para manter o perfil atualizado.
            </div>
          </div>

          {/* Footer com botões de ação */}
          <DialogFooter className="sticky bottom-0 left-0 right-0 flex-row w-full gap-2 bg-background pt-4 pb-[calc(0.5rem+var(--safe-bottom, env(safe-area-inset-bottom)))] sm:justify-end sm:space-x-0 sm:pb-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!isDirty}
            >
              <Check className="h-4 w-4" />
              Salvar alterações
            </Button>
          </DialogFooter>
        </form>

        {/* Dialog de crop de imagem (nested) */}
        <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
          <DialogContent className="flex flex-col w-[100dvw] h-[100dvh] max-w-[100dvw] max-h-[100dvh] rounded-none sm:w-[520px] sm:h-[520px] sm:max-w-[520px] sm:max-h-[520px]">
            <DialogHeader>
              <DialogTitle>Ajustar foto</DialogTitle>
            </DialogHeader>
            {imageSrc ? (
              <div className="flex flex-col gap-4 flex-1 min-h-0">
                {/* Componente de crop de imagem */}
                <ImageCropper
                  image={imageSrc}
                  aspectRatio={1}
                  onCropChange={setCropArea}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  className="flex-1 min-h-[280px] w-full self-center sm:flex-none sm:h-[320px]"
                />
                
                {/* Slider de zoom (apenas desktop) */}
                <div className="space-y-2 hidden sm:block">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Zoom</span>
                    <span className="text-muted-foreground">
                      {zoom.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Selecione uma imagem para recortar.
              </div>
            )}
            
            {/* Footer do modal de crop */}
            <DialogFooter className="mt-auto gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCropOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSaveCrop}
                disabled={!imageSrc || !cropArea || isSavingCrop}
              >
                Salvar recorte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}