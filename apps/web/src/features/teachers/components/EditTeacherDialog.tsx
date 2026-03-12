import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Check, ChevronDown, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { cropImage, ImageCropper, useImageCropper } from "@/features/ImageCropper";
import { useTeacherAvatarUpload } from "@/hooks/useTeacherAvatarUpload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { TeacherRow } from "./TeachersTable";

type TeacherResponse = {
  id: string;
  school_id: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  active: boolean;
  subjects?: Array<{ id: string; name: string }>;
};

type EditTeacherDialogProps = {
  open: boolean;
  teacher: TeacherRow | null;
  schoolOptions: Array<{ id: string; name: string }>;
  subjectOptions: Array<{ id: string; name: string }>;
  onOpenChange: (open: boolean) => void;
  onUpdated: (teacher: TeacherResponse) => void;
};

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "PR";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function EditTeacherDialog({
  open,
  teacher,
  schoolOptions,
  subjectOptions,
  onOpenChange,
  onUpdated,
}: EditTeacherDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [active, setActive] = useState(true);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [avatarSrc, setAvatarSrc] = useState("");
  const previousAvatarUrl = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { uploadAvatar } = useTeacherAvatarUpload();

  const { imageSrc, setImageSrc, cropArea, setCropArea, zoom, setZoom, loadFile } = useImageCropper({
    initialImage: teacher?.avatarUrl ?? "",
  });

  useEffect(() => {
    if (!teacher) return;
    setName(teacher.name);
    setEmail(teacher.email || "");
    setSchoolId(teacher.schoolId);
    setActive(teacher.active);
    setSubjectIds((teacher.subjects ?? []).map((subject) => subject.id));
    setAvatarSrc(teacher.avatarUrl ?? "");
    setImageSrc(teacher.avatarUrl ?? "");
  }, [setImageSrc, teacher]);

  useEffect(() => {
    const previous = previousAvatarUrl.current;
    if (previous && previous.startsWith("blob:") && previous !== avatarSrc) {
      URL.revokeObjectURL(previous);
    }
    previousAvatarUrl.current = avatarSrc || null;
  }, [avatarSrc]);

  useEffect(() => {
    return () => {
      const current = previousAvatarUrl.current;
      if (current && current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
    };
  }, []);

  const selectedSubjectsLabel = useMemo(() => {
    if (subjectIds.length === 0) return "Selecionar disciplinas";
    const names = subjectOptions
      .filter((option) => subjectIds.includes(option.id))
      .map((option) => option.name);
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  }, [subjectIds, subjectOptions]);

  const isDirty = useMemo(() => {
    if (!teacher) return false;
    const initialSubjectIds = (teacher.subjects ?? []).map((subject) => subject.id).sort();
    const currentSubjectIds = subjectIds.slice().sort();
    return (
      name.trim() !== teacher.name ||
      email.trim() !== (teacher.email || "") ||
      schoolId !== teacher.schoolId ||
      active !== teacher.active ||
      JSON.stringify(initialSubjectIds) !== JSON.stringify(currentSubjectIds)
    );
  }, [active, email, name, schoolId, subjectIds, teacher]);

  const toggleSubject = (subjectId: string) => {
    setSubjectIds((previous) =>
      previous.includes(subjectId)
        ? previous.filter((id) => id !== subjectId)
        : [...previous, subjectId]
    );
  };

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    loadFile(file);
    setIsCropOpen(true);
    event.target.value = "";
  }, [loadFile]);

  const handleOpenCrop = useCallback(() => {
    if (!avatarSrc) return;
    setImageSrc(avatarSrc);
    setIsCropOpen(true);
  }, [avatarSrc, setImageSrc]);

  const handleSaveCrop = useCallback(async () => {
    if (!teacher || !imageSrc || !cropArea) return;

    setIsSavingCrop(true);
    try {
      const blob = await cropImage(imageSrc, cropArea);
      const localUrl = URL.createObjectURL(blob);
      setAvatarSrc(localUrl);

      const extension = blob.type?.split("/")[1] || "jpg";
      const file = new File([blob], `teacher-avatar-${teacher.id}.${extension}`, {
        type: blob.type || "image/jpeg",
      });

      const uploadedAvatarUrl = await uploadAvatar(teacher.id, file);
      if (uploadedAvatarUrl) {
        setAvatarSrc(uploadedAvatarUrl);

        onUpdated({
          id: teacher.id,
          school_id: schoolId,
          name: name.trim(),
          email: email.trim(),
          avatar_url: uploadedAvatarUrl,
          active,
          subjects: teacher.subjects,
        });

        toast.success("Foto atualizada com sucesso");
      }
      setIsCropOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao enviar foto";
      toast.error(message);
    } finally {
      setIsSavingCrop(false);
    }
  }, [active, cropArea, email, imageSrc, name, onUpdated, schoolId, teacher, uploadAvatar]);

  const handleRemoveAvatar = useCallback(async () => {
    if (!teacher) return;

    try {
      const { data, message } = await api.patchWithMeta<TeacherResponse>(`/teachers/${teacher.id}`, {
        avatar_url: null,
      });
      setAvatarSrc("");
      setImageSrc("");
      onUpdated(data);
      toast.success(message || "Foto removida com sucesso");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao remover foto";
      toast.error(message);
    }
  }, [onUpdated, setImageSrc, teacher]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!teacher || isSaving) return;

    setIsSaving(true);
    try {
      const { data, message } = await api.patchWithMeta<TeacherResponse>(`/teachers/${teacher.id}`, {
        name: name.trim(),
        email: email.trim(),
        school_id: schoolId,
        active,
        subject_ids: subjectIds,
      });
      onUpdated(data);
      toast.success(message || "Professor atualizado com sucesso");
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar professor";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Editar professor</DialogTitle>
        </DialogHeader>

        {!teacher ? null : (
          <form className="mt-3 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 border-b border-border px-1 pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl"
                  onClick={handleOpenCrop}
                  aria-label="Editar foto do professor"
                >
                  <Avatar className="h-16 w-16 rounded-xl">
                    <AvatarImage src={avatarSrc || undefined} alt={name || teacher.name} />
                    <AvatarFallback className="rounded-xl text-lg font-semibold bg-muted/70">
                      {getInitials(name || teacher.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <div className="space-y-1">
                  <p className="text-base font-semibold">{name || teacher.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Atualize a foto e os dados usados no perfil.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={!avatarSrc}
                >
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Escola</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between">
                    <span className="truncate">
                      {schoolOptions.find((school) => school.id === schoolId)?.name ?? "Selecionar escola"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {schoolOptions.map((school) => (
                    <DropdownMenuItem key={school.id} onSelect={() => setSchoolId(school.id)}>
                      {school.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Disciplinas</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between">
                    <span className={cn("truncate text-left", subjectIds.length === 0 && "text-muted-foreground")}>
                      {selectedSubjectsLabel}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto">
                  {subjectOptions.map((subject) => (
                    <DropdownMenuCheckboxItem
                      key={subject.id}
                      checked={subjectIds.includes(subject.id)}
                      onCheckedChange={() => toggleSubject(subject.id)}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {subject.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActive(true)}
                  className={cn(
                    "inline-flex rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors",
                    active
                      ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                      : "border-slate-300 bg-slate-100 text-slate-600 hover:text-slate-700"
                  )}
                >
                  Ativo
                </button>
                <button
                  type="button"
                  onClick={() => setActive(false)}
                  className={cn(
                    "inline-flex rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors",
                    !active
                      ? "border-red-200 bg-red-100 text-red-700"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700"
                  )}
                >
                  Inativo
                </button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!isDirty || isSaving || !schoolId}>
                <Check className="h-4 w-4" />
                {isSaving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        )}

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
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Selecione uma imagem para recortar.</div>
            )}
            <DialogFooter className="mt-auto gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCropOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSaveCrop} disabled={!imageSrc || !cropArea || isSavingCrop}>
                <Check className="h-4 w-4" />
                {isSavingCrop ? "Salvando..." : "Salvar recorte"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
