import { useCallback, useState } from "react";
import { getStoredToken } from "@/features/auth/utils/auth-storage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message?: string;
  };
};

type UploadedUser = {
  id: string;
  avatar_url?: string;
};

export function useUserAvatarUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = useCallback(async (userId: string, file: File) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Usuário não autenticado");
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setIsUploading(true);
    try {
      const response = await fetch(`${API_URL}/users/${userId}/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const payload = (await response.json()) as ApiResponse<UploadedUser>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(
          payload.error?.message || payload.message || "Erro ao enviar foto"
        );
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
