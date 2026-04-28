import { getAccessToken } from "@/api/authStorage";
import { env } from "@/env";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function resolveUrl(path: string) {
  const base = env.apiBaseUrl ?? "/api";
  if (path.startsWith("http")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  const isFormData =
    typeof FormData !== "undefined" && init?.body != null && init.body instanceof FormData;

  if (init?.body && !headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (init?.auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(resolveUrl(path), {
    ...init,
    headers,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json") || contentType.includes("problem+json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const detail =
      typeof data === "object" && data && "detail" in (data as any)
        ? String((data as any).detail)
        : `Request gagal (${res.status})`;
    throw new ApiError(detail, res.status, data);
  }

  return data as T;
}

