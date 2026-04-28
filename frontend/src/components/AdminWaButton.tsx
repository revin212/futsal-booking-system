import { env } from "@/env";

function waLink(noHp: string) {
  const digits = noHp.replace(/[^\d]/g, "");
  // wa.me expects country code without "+"
  const normalized = digits.startsWith("62") ? digits : digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

export function AdminWaButton() {
  const noHp = env.adminWaNumber?.trim();
  if (!noHp) return null;

  return (
    <a
      href={waLink(noHp)}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50"
      aria-label="Hubungi admin via WhatsApp"
      title={`WhatsApp Admin: ${noHp}`}
    >
      <div className="rounded-full bg-primary text-primary-foreground shadow-lg px-4 py-3 text-sm font-semibold">
        WhatsApp Admin
      </div>
    </a>
  );
}

