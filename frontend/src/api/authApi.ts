import { apiFetch } from "@/api/http";

export type User = {
  id: string;
  email: string;
  namaLengkap: string;
  noHp: string | null;
  fotoProfil: string | null;
  createdAt: string;
  isBlocked: boolean;
  role: "ADMIN" | "USER";
};

export type GoogleAuthResponse = {
  accessToken: string;
  refreshToken: string | null;
  user: User;
};

export async function postGoogleAuth(idToken: string) {
  return apiFetch<GoogleAuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

