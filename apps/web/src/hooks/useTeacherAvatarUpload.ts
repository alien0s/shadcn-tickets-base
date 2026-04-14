import { useCallback, useState } from "react";
import { getStoredToken } from "@/features/auth/utils/auth-storage";
import { expireAuthSession, isUnauthorizedApiResponse } from "@/features/auth/utils/auth-session";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message?: string;
  };
};

type UploadedTeacher = {
  id: string;
  avatar_url?: string;
};

export function useTeacherAvatarUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = useCallback(async (teacherId: string, file: File) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Usuário não autenticado");
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setIsUploading(true);
    try {
      const response = await fetch(`${API_URL}/teachers/${teacherId}/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const payload = (await response.json()) as ApiResponse<UploadedTeacher>;
      if (!response.ok || !payload.success || !payload.data) {
        if (isUnauthorizedApiResponse(response.status, payload)) {
          expireAuthSession();
        }

        throw new Error(payload.error?.message || payload.message || "Erro ao enviar foto");
      }

      return payload.data.avatar_url ?? "";
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    isUploading,
    uploadAvatar,
  };
}
