import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearAccessToken, getStoredUser, onAuthChanged, type StoredUser } from "@/api/authStorage";

const navLinkClass =
  "text-sm font-lexend text-muted-foreground hover:text-primary transition-colors";

export function TopNav() {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    sync();
    return onAuthChanged(sync);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-lexend font-bold text-xl text-primary">
            FutsalKita
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/" className={navLinkClass}>
              Beranda
            </NavLink>
            <NavLink to="/lapangan" className={navLinkClass}>
              Katalog
            </NavLink>
            <NavLink to="/jadwal" className={navLinkClass}>
              Jadwal
            </NavLink>
            {user && (
              <NavLink to="/booking-saya" className={navLinkClass}>
                Booking Saya
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                {user.fotoProfil ? (
                  <img
                    src={user.fotoProfil}
                    alt={user.namaLengkap}
                    className="h-8 w-8 rounded-full border object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full border bg-muted" />
                )}
                <div className="leading-tight">
                  <div className="text-sm font-semibold font-lexend">{user.namaLengkap}</div>
                  <div className="text-xs text-muted-foreground">{user.role}</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg"
                onClick={() => {
                  clearAccessToken();
                  setUser(null);
                  navigate("/");
                }}
              >
                Keluar
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="rounded-lg">
              <Link to="/masuk">Masuk</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

