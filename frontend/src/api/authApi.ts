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

export type AdminLoginResponse = GoogleAuthResponse;

export async function postAdminLogin(email: string, password: string) {
  return apiFetch<AdminLoginResponse>("/auth/admin-login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

