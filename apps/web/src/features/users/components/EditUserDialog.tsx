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
import {
  Check,
  ChevronDown,
  KeyRound,
  Trash2,
  Upload,
  UserLock,
} from "lucide-react";
import type { UserRecord } from "../data/mockUsers";
import { getInitials } from "../utils/getInitials";
import {
  cropImage,
  ImageCropper,
  useImageCropper,
} from "@/features/ImageCropper";
import { EntitySelect } from "@/features/settings/components/EntitySelect";
import { ProfileField } from "@/features/settings/components/ProfileField";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDepartments } from "@/hooks/useDepartments";
import { useSchools } from "@/features/schools/hooks/useSchools";
import { useUserAvatarUpload } from "@/hooks/useUserAvatarUpload";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ADMIN_DEPARTMENT_ID = "7240712b-96de-418a-b6b3-344d12d64237";

export type EditUserDialogProps = {
  user: UserRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
  onUpdated?: (data: {
    name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    entity_id?: string;
    department_id?: string;
    role_id?: string;
    avatar_url?: string;
  }) => void;
};

function extractLocalPhoneDigits(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return "";

  // O input sempre exibe +55 no front, entao removemos o prefixo ao normalizar.
  const localDigits = digitsOnly.startsWith("55")
    ? digitsOnly.slice(2)
    : digitsOnly;

  return localDigits.slice(0, 11);
}

function normalizePhoneForDb(value: string): string | undefined {
  const localDigits = extractLocalPhoneDigits(value);
  return localDigits || undefined;
}

function formatPhoneForDisplay(value?: string): string {
  if (!value) return "";
  const digits = extractLocalPhoneDigits(value);
  if (!digits) return "";
  if (digits.length <= 2) return `+55 (${digits}`;
  if (digits.length <= 7) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function EditUserDialog({ user, open, onOpenChange, onUpdated }: EditUserDialogProps) {
  type UpdatedUser = {
    id: string;
    name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    entity_id?: string;
    department_id?: string;
    role_id?: string;
    avatar_url?: string;
  };
  // Estado do avatar (URL da imagem exibida)
  const [avatarSrc, setAvatarSrc] = useState(user.avatar ?? "");
  const previousAvatarUrl = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Estados do modal de crop
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { uploadAvatar } = useUserAvatarUpload();

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
    phone: "",
  });
  
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [initialSchoolId, setInitialSchoolId] = useState("");
  const [selectedSchoolName, setSelectedSchoolName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [initialDepartmentId, setInitialDepartmentId] = useState("");

  const { departments, isLoading: isLoadingDepartments } = useDepartments();
  const { schools, isLoading: isLoadingSchools } = useSchools();

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
      phone: formatPhoneForDisplay(user.phone),
    };
    
    setInitialValues(nextValues);
    setFormValues(nextValues);
    setSelectedSchoolName(user.entity);
    setAvatarSrc(user.avatar ?? "");
    setImageSrc(user.avatar ?? "");
  }, [setImageSrc, user.avatar, user.email, user.entity, user.name, user.phone]);

  useEffect(() => {
    if (schools.length === 0) return;

    const match = schools.find((item) => item.name === user.entity);
    const nextId = match?.id ?? "";
    const nextName = match?.name ?? "";

    setSchoolId(nextId);
    setInitialSchoolId(nextId);
    setSelectedSchoolName(nextName);
  }, [schools, user.entity]);

  useEffect(() => {
    if (departments.length === 0) return;

    const match = departments.find((item) => item.name === user.role);
    const nextId = match?.id ?? departments[0].id;

    setDepartmentId((current) => current || nextId);
    setInitialDepartmentId((current) => current || nextId);
  }, [departments, user.role]);

  const isAdministrativeDepartment = departmentId === ADMIN_DEPARTMENT_ID;

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
      formValues.phone !== initialValues.phone ||
      schoolId !== initialSchoolId ||
      departmentId !== initialDepartmentId,
    [
      departmentId,
      schoolId,
      formValues,
      initialDepartmentId,
      initialSchoolId,
      initialValues,
    ]
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
      const localUrl = URL.createObjectURL(blob);
      setAvatarSrc(localUrl);

      const extension = blob.type?.split("/")[1] || "jpg";
      const file = new File([blob], `avatar-${user.id}.${extension}`, {
        type: blob.type || "image/jpeg",
      });
      const uploadedAvatarUrl = await uploadAvatar(user.id, file);
      if (uploadedAvatarUrl) {
        setAvatarSrc(uploadedAvatarUrl);
        onUpdated?.({ avatar_url: uploadedAvatarUrl });
        toast.success("Foto atualizada com sucesso");
      }
      setIsCropOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao enviar foto";
      toast.error(errorMessage);
    } finally {
      setIsSavingCrop(false);
    }
  }, [cropArea, imageSrc, onUpdated, uploadAvatar, user.id]);

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

  // Handler para atualizar telefone com mascara +55 (XX) NNNNN-NNNN
  const handlePhoneChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneForDisplay(event.target.value);
    setFormValues((prev) => ({ ...prev, phone: formatted }));
  }, []);

  // Handler para atualizar escola
  const handleSchoolChange = useCallback(
    (value: string) => {
      setSelectedSchoolName(value);
      const match = schools.find((item) => item.name === value);
      setSchoolId(match?.id ?? "");
    },
    [schools]
  );

  // Handler para abrir input de arquivo
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handler para fechar dialog
  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Handler para submit do formulário
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;

    const name = formValues.firstName.trim();
    const lastName = formValues.lastName.trim();
    const email = formValues.email.trim();
    const phone = normalizePhoneForDb(formValues.phone);
    const roleId = user.role_id;

    setIsSaving(true);
    try {
      const { data, message } = await api.patchWithMeta<UpdatedUser>(
        `/users/${user.id}`,
        {
          name,
          last_name: lastName,
          email,
          phone,
          entity_id: isAdministrativeDepartment ? undefined : schoolId || undefined,
          department_id: departmentId,
          role_id: roleId,
        }
      );

      toast.success(message || "Usuario atualizado com sucesso");
      onOpenChange(false);
      if (data) {
        onUpdated?.({
          name: data.name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          entity_id: data.entity_id,
          department_id: data.department_id,
          role_id: data.role_id,
          avatar_url: data.avatar_url,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao atualizar usuario";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [
    departmentId,
    isAdministrativeDepartment,
    schoolId,
    formValues.email,
    formValues.firstName,
    formValues.lastName,
    formValues.phone,
    isSaving,
    onOpenChange,
    onUpdated,
    user.id,
    user.role_id,
  ]);

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
          className="mt-3 flex flex-col flex-1 min-h-0 gap-4 overflow-hidden"
          onSubmit={handleSubmit}
        >
          <div className="pr-1 pl-1 pb-4 flex-1 min-h-0 overflow-y-auto">
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
                description="Defina como entrar em contato com você."
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
              <ProfileField
                title="Telefone"
                description="Informe seu melhor número para contato."
              >
                <div className="grid gap-4">
                  <Input
                    id="phone"
                    type="tel"
                    value={formValues.phone}
                    onChange={handlePhoneChange}
                    placeholder="+55 (11) 99999-9999"
                    maxLength={19}
                  />
                </div>
              </ProfileField>

              {/* Campo de escola */}
              {!isAdministrativeDepartment && (
                <ProfileField
                  title="Escola"
                  description="Escola vinculada ao perfil."
                >
                  <EntitySelect
                    options={schools.map((item) => item.name)}
                    value={selectedSchoolName}
                    onChange={handleSchoolChange}
                  />
                </ProfileField>
              )}

              {/* Campo de departamento */}
              <ProfileField
                title="Departamento"
                description="Departamento responsável pelo perfil."
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between h-9"
                      disabled={isLoadingDepartments || departments.length === 0}
                    >
                      <span>
                        {departments.find((item) => item.id === departmentId)
                          ?.name ||
                          (isLoadingDepartments
                            ? "Carregando..."
                            : "Selecione um departamento")}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {departments.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        {isLoadingDepartments
                          ? "Carregando departamentos..."
                          : "Nenhum departamento encontrado"}
                      </div>
                    ) : (
                      <DropdownMenuRadioGroup
                        value={departmentId}
                        onValueChange={setDepartmentId}
                      >
                        {departments.map((option) => (
                          <DropdownMenuRadioItem
                            key={option.id}
                            value={option.id}
                          >
                            {option.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </ProfileField>

            </div>

            <div className="flex flex-col gap-2 border-b border-border px-1 py-4 sm:flex-row sm:items-center sm:px-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-1.5 sm:w-auto"
              >
                <UserLock className="h-4 w-4" />
                Personificar usuario
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-1.5 sm:w-auto"
              >
                <KeyRound className="h-4 w-4" />
                Resetar senha
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="w-full gap-1.5 sm:w-auto"
              >
                <Trash2 className="h-4 w-4" />
                Delete usuario
              </Button>
            </div>

            <Separator />

            
          </div>

          {/* Footer com botões de ação */}
          <DialogFooter className="flex-row w-full gap-2 bg-background pt-4 pb-[calc(0.5rem+var(--safe-bottom, env(safe-area-inset-bottom)))] sm:justify-end sm:space-x-0 sm:pb-0">
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
              disabled={
                !isDirty ||
                isSaving ||
                isLoadingDepartments ||
                isLoadingSchools ||
                !departmentId ||
                (!isAdministrativeDepartment && !schoolId)
              }
            >
              <Check className="h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar alterações"}
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


