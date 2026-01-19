import {
  useEffect,
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
import { Check, Trash2, Upload } from "lucide-react";
import {
  cropImage,
  ImageCropper,
  useImageCropper,
} from "@/features/ImageCropper";
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
  const [avatarSrc, setAvatarSrc] = useState(
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSU6TAn8zOX5VYek6Hq0ToTCdAbi0cyjHVQ8g&s"
  );
  const previousAvatarUrl = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const {
    imageSrc,
    setImageSrc,
    cropArea,
    setCropArea,
    zoom,
    setZoom,
    loadFile,
  } = useImageCropper({ initialImage: avatarSrc });
  const [initialValues, setInitialValues] = useState({
    firstName: "Alex",
    lastName: "Jackson",
    email: "finalui@yandex.com",
    entity: selectedEntity,
  });
  const [formValues, setFormValues] = useState({
    firstName: "Alex",
    lastName: "Jackson",
    email: "finalui@yandex.com",
    entity: selectedEntity,
  });

  useEffect(() => {
    const previous = previousAvatarUrl.current;
    if (previous && previous.startsWith("blob:") && previous !== avatarSrc) {
      URL.revokeObjectURL(previous);
    }
    previousAvatarUrl.current = avatarSrc;
    setImageSrc(avatarSrc);
  }, [avatarSrc, setImageSrc]);

  useEffect(() => {
    const isPristine =
      formValues.firstName === initialValues.firstName &&
      formValues.lastName === initialValues.lastName &&
      formValues.email === initialValues.email &&
      formValues.entity === initialValues.entity;

    if (isPristine && selectedEntity !== initialValues.entity) {
      const nextValues = {
        ...initialValues,
        entity: selectedEntity,
      };
      setInitialValues(nextValues);
      setFormValues(nextValues);
    }
  }, [formValues, initialValues, selectedEntity]);

  const isDirty =
    formValues.firstName !== initialValues.firstName ||
    formValues.lastName !== initialValues.lastName ||
    formValues.email !== initialValues.email ||
    formValues.entity !== initialValues.entity;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    loadFile(file);
    setIsCropOpen(true);
    event.target.value = "";
  };

  const handleOpenCrop = () => {
    if (!avatarSrc) return;
    setImageSrc(avatarSrc);
    setIsCropOpen(true);
  };

  const handleSaveCrop = async () => {
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
  };

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
              <AvatarImage src={avatarSrc} alt="Avatar" />
              <AvatarFallback className="rounded-xl text-lg font-semibold bg-muted/70">
                AJ
              </AvatarFallback>
            </Avatar>
          </button>
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
          <Button
            size="sm"
            className="gap-1.5"
            type="button"
            onClick={() => fileInputRef.current?.click()}
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

      <div className="divide-y divide-border">
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
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  firstName: event.target.value,
                }))
              }
            />
            <Input
              id="lastName"
              value={formValues.lastName}
              placeholder="Sobrenome"
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  lastName: event.target.value,
                }))
              }
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
                value={formValues.email}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
              />
            </LabeledInput>
          </div>
        </ProfileField>

        <ProfileField
          title="Entidade"
          description="Organização vinculada ao seu perfil."
        >
          <LabeledInput inputId="entity">
            <EntitySelect
              options={entities}
              value={formValues.entity}
              onChange={(value) => {
                setFormValues((prev) => ({
                  ...prev,
                  entity: value,
                }));
                onChangeEntity(value);
              }}
            />
          </LabeledInput>
        </ProfileField>
      </div>

      <Separator />

      <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Revise antes de salvar para manter o perfil atualizado.
        </div>
        <Button className="gap-2" size="sm" disabled={!isDirty}>
          <Check className="h-4 w-4" />
          Salvar alteracoes
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
    </>
  );
}
