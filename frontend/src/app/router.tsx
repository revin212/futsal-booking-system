import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { LapanganListPage } from "@/pages/LapanganListPage";
import { JadwalPage } from "@/pages/JadwalPage";
import { MasukPage } from "@/pages/MasukPage";
import { LapanganDetailPage } from "@/pages/LapanganDetailPage";
import { BookingNewPage } from "@/pages/BookingNewPage";
import { BookingSayaPage } from "@/pages/BookingSayaPage";
import { BookingDetailPage } from "@/pages/BookingDetailPage";
import { AdminBookingPage } from "@/pages/AdminBookingPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { PaymentGatewayMockPage } from "@/pages/PaymentGatewayMockPage";

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
      { path: "/admin/booking", element: <AdminBookingPage /> },
      { path: "/admin/dashboard", element: <AdminDashboardPage /> },
      { path: "/admin/login", element: <AdminLoginPage /> },
      { path: "/payment-gateway/:intentId", element: <PaymentGatewayMockPage /> },
      { path: "/masuk", element: <MasukPage /> }
    ],
  },
]);

