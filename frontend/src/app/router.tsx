import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { HomePage } from "@/pages/HomePage";
import { LapanganListPage } from "@/pages/LapanganListPage";
import { JadwalPage } from "@/pages/JadwalPage";
import { MasukPage } from "@/pages/MasukPage";
import { LapanganDetailPage } from "@/pages/LapanganDetailPage";
import { BookingNewPage } from "@/pages/BookingNewPage";
import { BookingSayaPage } from "@/pages/BookingSayaPage";
import { BookingDetailPage } from "@/pages/BookingDetailPage";
import { AdminBookingDetailPage } from "@/pages/AdminBookingDetailPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AdminBookingListPage } from "@/pages/AdminBookingListPage";
import { AdminBookingQueuePage } from "@/pages/AdminBookingQueuePage";
import { AdminKalenderPage } from "@/pages/AdminKalenderPage";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { PaymentGatewayMockPage } from "@/pages/PaymentGatewayMockPage";
import { InvoicePage } from "@/pages/InvoicePage";
import { AdminNotifikasiPage } from "@/pages/AdminNotifikasiPage";
import { AdminAuditLogPage } from "@/pages/AdminAuditLogPage";
import { AdminPenjualanPage } from "@/pages/AdminPenjualanPage";
import { AdminInvoiceListPage } from "@/pages/AdminInvoiceListPage";
import { AdminReportPage } from "@/pages/AdminReportPage";
import { AdminLapanganListPage } from "@/pages/AdminLapanganListPage";
import { AdminLapanganFormPage } from "@/pages/AdminLapanganFormPage";
import { AdminFotoLapanganPage } from "@/pages/AdminFotoLapanganPage";
import { AdminJamOperasionalPage } from "@/pages/AdminJamOperasionalPage";
import { AdminPaymentGatewayPage } from "@/pages/AdminPaymentGatewayPage";
import { AdminPelangganPage } from "@/pages/AdminPelangganPage";
import { AdminPelangganDetailPage } from "@/pages/AdminPelangganDetailPage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/lapangan", element: <LapanganListPage /> },
      { path: "/lapangan/:id", element: <LapanganDetailPage /> },
      { path: "/jadwal", element: <JadwalPage /> },
      { path: "/booking/new", element: <BookingNewPage /> },
      { path: "/booking/:id", element: <BookingDetailPage /> },
      { path: "/booking-saya", element: <BookingSayaPage /> },
      { path: "/payment-gateway/:intentId", element: <PaymentGatewayMockPage /> },
      { path: "/invoice/:bookingId", element: <InvoicePage /> },
      { path: "/masuk", element: <MasukPage /> },
      { path: "/admin/login", element: <AdminLoginPage /> },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: "dashboard", element: <AdminDashboardPage /> },
          {
            path: "booking",
            element: <Outlet />,
            children: [
              { index: true, element: <AdminBookingListPage /> },
              { path: "queue", element: <AdminBookingQueuePage /> },
              { path: "kalender", element: <AdminKalenderPage /> },
              { path: ":id", element: <AdminBookingDetailPage /> },
            ],
          },
          {
            path: "keuangan",
            element: <Outlet />,
            children: [
              { path: "penjualan", element: <AdminPenjualanPage /> },
              { path: "invoice", element: <AdminInvoiceListPage /> },
              { path: "report", element: <AdminReportPage /> },
            ],
          },
          {
            path: "katalog",
            element: <Outlet />,
            children: [
              {
                path: "lapangan",
                element: <Outlet />,
                children: [
                  { index: true, element: <AdminLapanganListPage /> },
                  { path: "new", element: <AdminLapanganFormPage /> },
                  { path: ":id/edit", element: <AdminLapanganFormPage /> },
                  { path: ":id/foto", element: <AdminFotoLapanganPage /> },
                  { path: ":id/jam-operasional", element: <AdminJamOperasionalPage /> },
                ],
              },
            ],
          },
          { path: "payment-gateway", element: <AdminPaymentGatewayPage /> },
          {
            path: "sistem",
            element: <Outlet />,
            children: [
              { path: "pelanggan", element: <AdminPelangganPage /> },
              { path: "pelanggan/:id", element: <AdminPelangganDetailPage /> },
              { path: "notifikasi", element: <AdminNotifikasiPage /> },
              { path: "audit-log", element: <AdminAuditLogPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
