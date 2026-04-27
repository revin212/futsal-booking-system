import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { LapanganListPage } from "@/pages/LapanganListPage";
import { JadwalPage } from "@/pages/JadwalPage";
import { MasukPage } from "@/pages/MasukPage";
import { LapanganDetailPage } from "@/pages/LapanganDetailPage";
import { BookingNewPage } from "@/pages/BookingNewPage";
import { BookingSayaPage } from "@/pages/BookingSayaPage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/lapangan", element: <LapanganListPage /> },
      { path: "/lapangan/:id", element: <LapanganDetailPage /> },
      { path: "/jadwal", element: <JadwalPage /> },
      { path: "/booking/new", element: <BookingNewPage /> },
      { path: "/booking-saya", element: <BookingSayaPage /> },
      { path: "/masuk", element: <MasukPage /> }
    ],
  },
]);

