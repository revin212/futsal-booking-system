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
      case DIBAYAR -> "Dibayar";
      case SELESAI -> "Selesai";
      case DIBUAT -> "Dipesan";
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

