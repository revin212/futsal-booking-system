import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { postAdminLogin } from "@/api/authApi";
import { clearAccessToken, getAuthSession, setAccessToken, setStoredUser } from "@/api/authStorage";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const session = getAuthSession();
  const user = session?.user ?? null;

  const [email, setEmail] = useState("admin@futsal.com");
  const [password, setPassword] = useState("");

  const returnTo = useMemo(() => sp.get("returnTo") ?? "/admin/dashboard", [sp]);

  useEffect(() => {
    if (!user) return;
    if (user.role === "ADMIN") navigate(returnTo, { replace: true });
  }, [navigate, returnTo, user]);

  const mutation = useMutation({
    mutationFn: () => postAdminLogin(email, password),
    onSuccess: (res) => {
      setAccessToken(res.accessToken);
      setStoredUser({
        id: res.user.id,
        email: res.user.email,
        namaLengkap: res.user.namaLengkap,
        fotoProfil: res.user.fotoProfil,
        role: res.user.role,
      });
      toast.success(`Admin login sukses: ${res.user.namaLengkap}`);
      navigate(returnTo, { replace: true });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Login admin gagal");
    },
  });

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
          <CardContent className="space-y-3">
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
              className="w-full rounded-lg"
              disabled={mutation.isPending || !email.trim() || !password}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Memproses..." : "Masuk sebagai Admin"}
            </Button>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Button asChild variant="outline" className="rounded-lg" size="sm">
              <Link to="/">Beranda</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-lg" size="sm">
              <Link to="/masuk">Login User</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                clearAccessToken();
                toast.success("Session dibersihkan");
              }}
            >
              Clear session
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

