import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Receipt,
  Shield,
  Users,
  Wallet,
  Bell,
  ClipboardList,
  CreditCard,
  FileBarChart,
  Home,
} from "lucide-react";

import { clearAccessToken } from "@/api/authStorage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLink =
  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const navActive = "bg-primary/10 text-primary font-semibold";

type SectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="px-2 py-1">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted/80"
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open ? "rotate-0" : "-rotate-90")} />
      </button>
      {open ? <div className="mt-1 space-y-0.5 pl-0">{children}</div> : null}
    </div>
  );
}

type Props = {
  onNavigate?: () => void;
};

export function AdminSidebar({ onNavigate }: Props) {
  function wrapNavigate() {
    onNavigate?.();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-4 border-b">
        <NavLink
          to="/admin/dashboard"
          onClick={wrapNavigate}
          className="font-lexend text-lg font-bold text-primary flex items-center gap-2"
        >
          <Shield className="h-6 w-6" />
          Admin FutsalKita
        </NavLink>
        <p className="text-xs text-muted-foreground mt-1">Panel operasional</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-2">
        <div className="px-2">
          <NavLink
            to="/admin/dashboard"
            onClick={wrapNavigate}
            className={({ isActive }) => cn(navLink, isActive && navActive)}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Dashboard
          </NavLink>
        </div>

        <Section title="Booking">
          <NavLink
            to="/admin/booking"
            end
            onClick={wrapNavigate}
            className={({ isActive }) => cn(navLink, isActive && navActive)}
          >
            <ListChecks className="h-4 w-4 shrink-0" />
            List Booking
          </NavLink>
          <NavLink to="/admin/booking/queue" onClick={wrapNavigate} className={({ isActive }) => cn(navLink, isActive && navActive)}>
            <ClipboardList className="h-4 w-4 shrink-0" />
            Antrian Verifikasi
          </NavLink>
          <NavLink to="/admin/booking/kalender" onClick={wrapNavigate} className={({ isActive }) => cn(navLink, isActive && navActive)}>
            <CalendarDays className="h-4 w-4 shrink-0" />
            Kalender
          </NavLink>
        </Section>

        <Section title="Keuangan">
          <NavLink to="/admin/keuangan/penjualan" onClick={wrapNavigate} className={({ isActive }) => cn(navLink, isActive && navActive)}>
            <Wallet className="h-4 w-4 shrink-0" />
            Penjualan
          </NavLink>
          <NavLink to="/admin/keuangan/invoice" onClick={wrapNavigate} className={({ isActive }) => cn(navLink, isActive && navActive)}>
            <Receipt className="h-4 w-4 shrink-0" />
            Invoice
          </NavLink>
          <NavLink to="/admin/keuangan/report" onClick={wrapNavigate} className={({ isActive }) => cn(navLink, isActive && navActive)}>
            <FileBarChart className="h-4 w-4 shrink-0" />
            Report
          </NavLink>
        </Section>

        <Section title="Katalog">
          <NavLink to="/admin/katalog/lapangan" onClick={wrapNavigate} className={({ isActive }) => cn(navLink, isActive && navActive)}>
            <Building2 className="h-4 w-4 shrink-0" />
            Lapangan
          </NavLink>
        </Section>

        <div className="px-2">
          <NavLink to="/admin/payment-gateway" onClick={wrapNavigate} className={({ isActive }) => cn(navLink, isActive && navActive)}>
            <CreditCard className="h-4 w-4 shrink-0" />
            Cara bayar & biaya admin
          </NavLink>
        </div>

        <Section title="User & Sistem">
          <NavLink to="/admin/sistem/pelanggan" onClick={wrapNavigate} className={({ isActive }) => cn(navLink, isActive && navActive)}>
            <Users className="h-4 w-4 shrink-0" />
            Pelanggan
          </NavLink>
          <NavLink to="/admin/sistem/notifikasi" onClick={wrapNavigate} className={({ isActive }) => cn(navLink, isActive && navActive)}>
            <Bell className="h-4 w-4 shrink-0" />
            Notifikasi
          </NavLink>
          <NavLink to="/admin/sistem/audit-log" onClick={wrapNavigate} className={({ isActive }) => cn(navLink, isActive && navActive)}>
            <ClipboardList className="h-4 w-4 shrink-0" />
            Audit Log
          </NavLink>
        </Section>
      </nav>

      <div className="p-3 border-t space-y-2 mt-auto">
        <Button asChild variant="outline" className="w-full justify-start rounded-lg" size="sm">
          <Link to="/" onClick={wrapNavigate}>
            <Home className="h-4 w-4 mr-2" />
            Beranda publik
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground rounded-lg"
          size="sm"
          onClick={() => {
            clearAccessToken();
            wrapNavigate();
            window.location.href = "/";
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Keluar
        </Button>
      </div>
    </div>
  );
}
