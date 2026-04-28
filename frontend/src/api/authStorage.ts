const ACCESS_TOKEN_KEY = "futsalkita.accessToken";
const USER_KEY = "futsalkita.user";
const AUTH_CHANGED_EVENT = "auth-changed";

export type StoredUser = {
  id: string;
  email: string;
  namaLengkap: string;
  fotoProfil: string | null;
  role: "ADMIN" | "USER";
};

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  notifyAuthChanged();
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyAuthChanged();
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthChanged();
}

export function onAuthChanged(handler: () => void) {
  window.addEventListener(AUTH_CHANGED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

