import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import { env } from "@/env";
import { postGoogleAuth } from "@/api/authApi";
import { setAccessToken, setStoredUser } from "@/api/authStorage";
import { Button } from "@/components/ui/button";

export function MasukPage() {
  const clientId = env.googleClientId;
  const clientIdReady = Boolean(clientId && !clientId.includes("CHANGE_ME"));

  const [isGisReady, setIsGisReady] = useState(false);

  const mutation = useMutation({
    mutationFn: postGoogleAuth,
    onSuccess: (res) => {
      setAccessToken(res.accessToken);
      setStoredUser({
        id: res.user.id,
        email: res.user.email,
        namaLengkap: res.user.namaLengkap,
        fotoProfil: res.user.fotoProfil,
        role: res.user.role,
      });
      toast.success(`Selamat datang, ${res.user.namaLengkap}`);
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Login gagal");
    },
  });

  const handleCredential = useCallback(
    (response: any) => {
      const idToken = response?.credential;
      if (!idToken) {
        toast.error("Gagal mendapatkan Google credential.");
        return;
      }
      mutation.mutate(idToken);
    },
    [mutation]
  );

  const buttonId = useMemo(() => "google-signin-btn", []);

  useEffect(() => {
    const t = window.setInterval(() => {
      if (window.google?.accounts?.id) {
        setIsGisReady(true);
        window.clearInterval(t);
      }
    }, 100);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isGisReady) return;
    if (!clientIdReady) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      auto_select: false,
    });

    window.google.accounts.id.renderButton(document.getElementById(buttonId), {
      theme: "outline",
      size: "large",
      width: 360,
      text: "signin_with",
      shape: "rectangular",
    });
  }, [buttonId, clientId, clientIdReady, handleCredential, isGisReady]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="text-center">
            <h1 className="font-lexend text-3xl font-bold">Selamat Datang</h1>
            <p className="text-muted-foreground mt-2">
              Masuk untuk booking & lihat riwayat
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {!clientIdReady && (
              <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                Google Client ID belum di-set. Isi env `GOOGLE_CLIENT_ID` di `docker-compose.yml` (atau `.env`)
                agar tombol login bisa dipakai.
              </div>
            )}

            <div className="flex justify-center">
              {clientIdReady ? (
                <div id={buttonId} />
              ) : (
                <Button className="w-full rounded-lg" disabled>
                  Masuk dengan Google
                </Button>
              )}
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Dengan masuk, Anda menyetujui Syarat & Ketentuan kami.
            </div>
          </div>
        </div>

        <div className="border-t bg-muted/10 px-8 py-4 text-xs text-muted-foreground">
          Status: {mutation.isPending ? "Memproses..." : "Siap"}
        </div>
      </div>
    </div>
  );
}

