import { Outlet, useLocation } from "react-router-dom";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

export function RootLayout() {
  const { pathname } = useLocation();
  const hidePublicChrome =
    pathname.startsWith("/admin") && pathname !== "/admin/login";

  return (
    <div className="min-h-screen flex flex-col">
      {!hidePublicChrome ? <TopNav /> : null}
      <main className="flex-1">
        <Outlet />
      </main>
      {!hidePublicChrome ? <Footer /> : null}
    </div>
  );
}

