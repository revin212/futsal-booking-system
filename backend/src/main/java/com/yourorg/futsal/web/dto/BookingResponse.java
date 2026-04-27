package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.Booking;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record BookingResponse(
    Long id,
    UUID userId,
    Long lapanganId,
    LocalDate tanggalMain,
    LocalTime jamMulai,
    LocalTime jamSelesai,
    String status,
    BigDecimal totalHarga,
    Instant createdAt
) {
  public static BookingResponse from(Booking b) {
    return new BookingResponse(
        b.getId(),
        b.getUserId(),
        b.getLapangan().getId(),
        b.getTanggalMain(),
        b.getJamMulai(),
        b.getJamSelesai(),
        b.getStatus().name(),
        b.getTotalHarga(),
        b.getCreatedAt()
    );
  }
}

