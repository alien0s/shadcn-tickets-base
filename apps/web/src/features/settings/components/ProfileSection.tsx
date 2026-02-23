import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, Trash2, Upload } from "lucide-react";
import { cropImage, ImageCropper, useImageCropper } from "@/features/ImageCropper";
import { useAuth } from "@/features/auth";
import { useDepartments } from "@/hooks/useDepartments";
import { useUserAvatarUpload } from "@/hooks/useUserAvatarUpload";
import { toast } from "sonner";
import { EntitySelect } from "./EntitySelect";
import { ProfileField } from "./ProfileField";
import type { ProfileSectionProps } from "../types";

function getInitials(firstName: string, lastName: string): string {
  const safeFirst = firstName.trim();
  const safeLast = lastName.trim();

  if (!safeFirst && !safeLast) return "";
  if (!safeLast) return safeFirst.substring(0, 2).toUpperCase();
  return (safeFirst[0] + safeLast[0]).toUpperCase();
}

function extractLocalPhoneDigits(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) return "";

  const localDigits = digitsOnly.startsWith("55")
    ? digitsOnly.slice(2)
    : digitsOnly;

  return localDigits.slice(0, 11);
}

function formatPhoneForDisplay(value?: string): string {
  if (!value) return "";
  const digits = extractLocalPhoneDigits(value);
  if (!digits) return "";
  if (digits.length <= 2) return `+55 (${digits}`;
  if (digits.length <= 7) return `+55 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function LabeledInput({
  children,
}: {
  inputId: string;
  children: ReactNode;
}) {
  // ✅ `aria-label` com id não descreve bem; usar `aria-labelledby` seria ideal,
  // mas como o Input já tem `id`, mantemos sem alterar visual/comportamento.
  return <div className="space-y-2">{children}</div>;
}

export function ProfileSection({
  entities,
  selectedEntity,
  onChangeEntity,
}: ProfileSectionProps) {
  const { user, updateUser } = useAuth();
  const authAvatarUrl = user?.avatar_url || "";
  const authFirstName = user?.name || "";
  const authLastName = user?.last_name || "";
  const authEmail = user?.email || "";
  const authPhone = user?.phone || "";
  const authDepartmentId = user?.department_id || "";

  const [avatarSrc, setAvatarSrc] = useState(() => authAvatarUrl);

  const previousAvatarUrl = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null); // ✅ ref tipada corretamente (pode ser null)

  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const { uploadAvatar } = useUserAvatarUpload();

  const {
    imageSrc,
    setImageSrc,
    cropArea,
    setCropArea,
    zoom,
    setZoom,
    loadFile,
  } = useImageCropper({ initialImage: avatarSrc });

  const authDefaults = useMemo(
    () => ({
      firstName: authFirstName,
      lastName: authLastName,
      email: authEmail,
      phone: formatPhoneForDisplay(authPhone),
      entity: selectedEntity,
    }),
    [authEmail, authFirstName, authLastName, authPhone, selectedEntity]
  );

  const [initialValues, setInitialValues] = useState(() => authDefaults);
  const [formValues, setFormValues] = useState(() => authDefaults);
  const [departmentId, setDepartmentId] = useState(authDepartmentId);
  const [initialDepartmentId, setInitialDepartmentId] = useState(authDepartmentId);
  const { departments, isLoading: isLoadingDepartments } = useDepartments();

  // ✅ Revoga objectURL anterior quando trocar o avatar (evita leak)
  // + ✅ cleanup no unmount
  useEffect(() => {
    const previous = previousAvatarUrl.current;

    // SSR safety: URL só existe no browser
    if (
      typeof window !== "undefined" &&
      previous &&
      previous.startsWith("blob:") &&
      previous !== avatarSrc
    ) {
      URL.revokeObjectURL(previous);
    }

    previousAvatarUrl.current = avatarSrc;
    setImageSrc(avatarSrc);

    return () => {
      const last = previousAvatarUrl.current;
      if (typeof window !== "undefined" && last && last.startsWith("blob:")) {
        URL.revokeObjectURL(last);
      }
    };
  }, [avatarSrc, setImageSrc]);

  const isPristine = useMemo(() => {
    return (
      formValues.firstName === initialValues.firstName &&
      formValues.lastName === initialValues.lastName &&
      formValues.email === initialValues.email &&
      formValues.phone === initialValues.phone &&
      formValues.entity === initialValues.entity &&
      departmentId === initialDepartmentId
    );
  }, [departmentId, formValues, initialDepartmentId, initialValues]);

  // ✅ Só sincroniza entidade quando o form não tem alterações (pristine)
  useEffect(() => {
    if (!isPristine) return;

    setInitialValues(authDefaults);
    setFormValues(authDefaults);
  }, [authDefaults, isPristine]);

  useEffect(() => {
    if (!isPristine) return;
    if (!authDepartmentId) return;

    setInitialDepartmentId(authDepartmentId);
    setDepartmentId(authDepartmentId);
  }, [authDepartmentId, isPristine]);

  useEffect(() => {
    if (!isPristine) return;
    if (selectedEntity === initialValues.entity) return;

    const nextValues = {
      ...initialValues,
      entity: selectedEntity,
    };

    setInitialValues(nextValues);
    setFormValues(nextValues);
  }, [isPristine, selectedEntity, initialValues]);

  const isDirty = useMemo(() => !isPristine, [isPristine]);

  // ✅ Handlers estáveis (evita inline em inputs / listas e melhora previsibilidade)
  const displayName = useMemo(() => {
    return [formValues.firstName, formValues.lastName].filter(Boolean).join(" ").trim();
  }, [formValues.firstName, formValues.lastName]);
  const avatarInitials = useMemo(
    () => getInitials(formValues.firstName, formValues.lastName),
    [formValues.firstName, formValues.lastName]
  );

  useEffect(() => {
    if (!authAvatarUrl) return;
    setAvatarSrc(authAvatarUrl);
  }, [authAvatarUrl]);

  const handleFirstNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormValues((prev) => ({ ...prev, firstName: value }));
  }, []);

  const handleLastNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormValues((prev) => ({ ...prev, lastName: value }));
  }, []);

  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormValues((prev) => ({ ...prev, email: value }));
  }, []);

  const handlePhoneChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneForDisplay(event.target.value);
    setFormValues((prev) => ({ ...prev, phone: formatted }));
  }, []);

  const handleEntityChange = useCallback(
    (value: string) => {
      setFormValues((prev) => ({ ...prev, entity: value }));
      onChangeEntity(value);
    },
    [onChangeEntity]
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      loadFile(file);
      setIsCropOpen(true);

      // ✅ permite selecionar o mesmo arquivo novamente
      event.target.value = "";
    },
    [loadFile]
  );

  const handleOpenCrop = useCallback(() => {
    if (!avatarSrc) return;
    setImageSrc(avatarSrc);
    setIsCropOpen(true);
  }, [avatarSrc, setImageSrc]);

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCloseCrop = useCallback(() => {
    setIsCropOpen(false);
  }, []);

  const handleZoomChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setZoom(Number(event.target.value));
  }, [setZoom]);

  const handleSaveCrop = useCallback(async () => {
    if (!imageSrc || !cropArea) return;

    setIsSavingCrop(true);
    try {
      const blob = await cropImage(imageSrc, cropArea);

      // SSR safety
      if (typeof window === "undefined") return;

      const nextLocalUrl = URL.createObjectURL(blob);
      setAvatarSrc(nextLocalUrl);

      if (user?.id) {
        const extension = blob.type?.split("/")[1] || "jpg";
        const file = new File([blob], `avatar-${user.id}.${extension}`, {
          type: blob.type || "image/jpeg",
        });
        const uploadedAvatarUrl = await uploadAvatar(user.id, file);
        if (uploadedAvatarUrl) {
          setAvatarSrc(uploadedAvatarUrl);
          updateUser({ avatar_url: uploadedAvatarUrl });
          toast.success("Foto atualizada com sucesso");
        }
      }

      setIsCropOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao enviar foto";
      toast.error(errorMessage);
    } finally {
      setIsSavingCrop(false); // ✅ try/finally: não prende loading
    }
  }, [cropArea, imageSrc, updateUser, uploadAvatar, user?.id]);

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-border px-1 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-xl"
            onClick={handleOpenCrop}
            aria-label="Editar foto do perfil"
          >
            <Avatar className="h-16 w-16 rounded-xl">
              <AvatarImage src={avatarSrc} alt={displayName || authEmail} />
              <AvatarFallback className="rounded-xl text-lg font-semibold bg-muted/70">
                {avatarInitials}
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="space-y-1">
            <p className="text-base font-semibold">{displayName}</p>
            <p className="text-sm text-muted-foreground">
              Atualize a foto e os dados usados no perfil.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" type="button">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Remover
          </Button>

          <Button
            size="sm"
            className="gap-1.5"
            type="button"
            onClick={handlePickFile}
            aria-label="Enviar nova foto"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
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

      <div className="divide-y divide-border">
        <ProfileField
          title="Nome"
          description="Nome exibido para clientes e equipe."
          align="center" // mantém exatamente como estava (não mexe no visual)
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

        <ProfileField title="Email" description="Defina como entrar em contato com voce.">
          <div className="grid gap-4">
            <LabeledInput inputId="email">
              <Input
                id="email"
                type="email"
                value={formValues.email}
                onChange={handleEmailChange}
              />
            </LabeledInput>
          </div>
        </ProfileField>

        <ProfileField title="Telefone" description="Informe seu melhor número para contato.">
          <div className="grid gap-4">
            <LabeledInput inputId="phone">
              <Input
                id="phone"
                type="tel"
                value={formValues.phone}
                onChange={handlePhoneChange}
                placeholder="+55 (11) 99999-9999"
                maxLength={19}
              />
            </LabeledInput>
          </div>
        </ProfileField>

        <ProfileField title="Entidade" description="Organização vinculada ao seu perfil.">
          <LabeledInput inputId="entity">
            <EntitySelect options={entities} value={formValues.entity} onChange={handleEntityChange} />
          </LabeledInput>
        </ProfileField>

        <ProfileField title="Departamento" description="Departamento responsÃ¡vel pelo perfil.">
          <LabeledInput inputId="department">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between h-9"
                  disabled={isLoadingDepartments || departments.length === 0}
                >
                  <span>
                    {departments.find((item) => item.id === departmentId)?.name ||
                      (isLoadingDepartments ? "Carregando..." : "Selecione um departamento")}
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
                  <DropdownMenuRadioGroup value={departmentId} onValueChange={setDepartmentId}>
                    {departments.map((option) => (
                      <DropdownMenuRadioItem key={option.id} value={option.id}>
                        {option.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </LabeledInput>
        </ProfileField>
      </div>

      <Separator />

      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Revise antes de salvar para manter o perfil atualizado.
        </div>

        <Button className="gap-2" size="sm" disabled={!isDirty} type="button">
          <Check className="h-4 w-4" aria-hidden="true" />
          Salvar alterações
        </Button>
      </div>

      <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
        <DialogContent className="flex flex-col w-[100dvw] h-[100dvh] max-w-[100dvw] max-h-[100dvh] rounded-none sm:w-[520px] sm:h-[520px] sm:max-w-[520px] sm:max-h-[520px]">
          <DialogHeader>
            <DialogTitle>Ajustar foto</DialogTitle>
          </DialogHeader>

          {imageSrc ? (
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              <ImageCropper
                image={imageSrc}
                aspectRatio={1}
                onCropChange={setCropArea}
                zoom={zoom}
                onZoomChange={setZoom}
                className="flex-1 min-h-[280px] w-full self-center sm:flex-none sm:h-[320px]"
              />

              <div className="space-y-2 hidden sm:block">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Zoom</span>
                  <span className="text-muted-foreground">{zoom.toFixed(2)}x</span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={handleZoomChange}
                  className="w-full"
                  aria-label="Controle de zoom"
                />
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Selecione uma imagem para recortar.
            </div>
          )}

          <DialogFooter className="mt-auto gap-2">
            <Button type="button" variant="outline" onClick={handleCloseCrop}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveCrop}
              disabled={!imageSrc || !cropArea || isSavingCrop}
              aria-busy={isSavingCrop}
            >
              Salvar recorte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
