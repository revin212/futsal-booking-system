import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { postAdminLogin } from "@/api/authApi";
import { getAuthSession, setAccessToken, setStoredUser } from "@/api/authStorage";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ADMIN_DEMO = {
  id: "demo",
  label: "Akun admin demo",
  email: "admin@futsal.com",
  password: "admin12345",
} as const;

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const session = getAuthSession();
  const user = session?.user ?? null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoAccountId, setDemoAccountId] = useState<string>("");

  const returnTo = useMemo(() => sp.get("returnTo") ?? "/admin/dashboard", [sp]);

  useEffect(() => {
    if (!user) return;
    if (user.role === "ADMIN") navigate(returnTo, { replace: true });
  }, [navigate, returnTo, user]);

  const mutation = useMutation({
    mutationFn: ({ email: em, password: pw }: { email: string; password: string }) =>
      postAdminLogin(em, pw),
    onSuccess: (res) => {
      setAccessToken(res.accessToken);
      setStoredUser({
        id: res.user.id,
        email: res.user.email,
        namaLengkap: res.user.namaLengkap,
        fotoProfil: res.user.fotoProfil,
        noHp: res.user.noHp,
        role: res.user.role,
      });
      toast.success(`Admin login sukses: ${res.user.namaLengkap}`);
      navigate(returnTo, { replace: true });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Login admin gagal");
    },
  });

  function submitLogin() {
    const em = email.trim();
    if (!em || !password || mutation.isPending) return;
    mutation.mutate({ email: em, password });
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              Untuk akses <span className="font-medium">/admin/dashboard</span>. Akun admin tidak memakai Google OAuth.
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                submitLogin();
              }}
            >
              <div className="space-y-1">
                <div className="text-sm font-medium">Akun admin demo</div>
                <Select
                  value={demoAccountId || undefined}
                  onValueChange={(v) => {
                    setDemoAccountId(v);
                    if (v === ADMIN_DEMO.id) {
                      setEmail(ADMIN_DEMO.email);
                      setPassword(ADMIN_DEMO.password);
                    }
                  }}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Pilih untuk mengisi email & password otomatis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ADMIN_DEMO.id}>{ADMIN_DEMO.label}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Email</div>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@futsal.com"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">Password</div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-lg"
                disabled={mutation.isPending || !email.trim() || !password}
              >
                {mutation.isPending ? "Memproses..." : "Masuk sebagai Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

