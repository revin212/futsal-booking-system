package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.Booking;
import java.util.Map;

public record KalenderEventResponse(
    String title,
    String start,
    String end,
    String color,
    Map<String, Object> extendedProps
) {
  public static KalenderEventResponse fromBooking(Booking b, String startIso, String endIso, String color) {
    String title = switch (b.getStatus()) {
      case DIBATALKAN -> "Dibatalkan";
      case LUNAS, DIBAYAR -> "Lunas";
      case MENUNGGU_VERIFIKASI -> "Menunggu verifikasi";
      case DITOLAK -> "Ditolak";
      case SELESAI -> "Selesai";
      case DIBUAT, MENUNGGU_PEMBAYARAN -> "Menunggu pembayaran";
    };

    return new KalenderEventResponse(
        title,
        startIso,
        endIso,
        color,
        Map.of(
            "bookingId", b.getId(),
            "status", b.getStatus().name(),
            "lapanganId", b.getLapangan().getId()
        )
    );
  }
}

