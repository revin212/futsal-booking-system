import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";

import { clearAccessToken, getAuthSession } from "@/api/authStorage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AdminSidebar } from "@/components/layout/AdminSidebar";

export function AdminLayout() {
  const session = getAuthSession();
  const user = session?.user ?? null;
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (user) return;
    clearAccessToken();
    navigate(`/admin/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
  }, [user, navigate, location.pathname, location.search]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Akses ditolak</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Halaman ini hanya untuk admin.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex bg-muted/30">
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r bg-card">
          <AdminSidebar />
        </aside>

        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-2 border-b bg-card px-3 h-14">
            <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => setMobileOpen(true)} aria-label="Menu admin">
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/admin/dashboard" className="font-lexend font-semibold text-primary truncate">
              Admin
            </Link>
          </div>
          <DialogContent className="lg:hidden fixed left-0 top-0 h-full max-h-none w-[min(100vw,18rem)] max-w-[min(100vw,18rem)] !translate-x-0 !translate-y-0 rounded-none border-r p-0 shadow-xl sm:max-w-[min(100vw,18rem)]" hideClose>
            <DialogTitle className="sr-only">Menu admin</DialogTitle>
            <div className="h-full overflow-y-auto border-r bg-card pt-14 pb-6">
              <AdminSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
