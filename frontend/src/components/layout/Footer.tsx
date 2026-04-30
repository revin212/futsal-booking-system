import { env } from "@/env";

export function Footer() {
  const adminWa = env.adminWaNumber?.trim();

  return (
    <footer className="border-t bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="font-lexend font-bold text-lg">FutsalKita</div>
          <p className="text-sm text-muted-foreground mt-2">
            © {new Date().getFullYear()} FutsalKita. Booking Lapangan Jadi Mudah.
          </p>
        </div>
        <div className="flex flex-col md:items-end gap-2 text-sm">
          <a className="text-muted-foreground hover:text-primary underline" href="#">
            Tentang Kami
          </a>
          <a className="text-muted-foreground hover:text-primary underline" href="#">
            Syarat & Ketentuan
          </a>
          <a className="text-muted-foreground hover:text-primary underline" href="#">
            Bantuan
          </a>
          <a className="text-muted-foreground hover:text-primary underline" href="#">
            Kebijakan Privasi
          </a>
          {adminWa ? (
            <div className="pt-2 text-xs text-muted-foreground">
              WhatsApp Admin: <span className="font-mono text-foreground">{adminWa}</span>
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

