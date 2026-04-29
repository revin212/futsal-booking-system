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
    String lapanganNama,
    LocalDate tanggalMain,
    LocalTime jamMulai,
    LocalTime jamSelesai,
    String status,
    BigDecimal totalHarga,
    String metodePembayaran,
    String noHp,
    BigDecimal adminFee,
    BigDecimal grandTotal,
    BigDecimal dpNominal,
    BigDecimal paidAmount,
    String buktiBayarPath,
    Instant verifiedAt,
    String invoiceNumber,
    Instant invoiceIssuedAt,
    String refundStatus,
    Instant refundRequestedAt,
    Instant refundProcessedAt,
    String refundReason,
    BigDecimal refundAmount,
    Instant createdAt
) {
  public static BookingResponse from(Booking b) {
    BigDecimal adminFee = b.getAdminFee() == null ? BigDecimal.ZERO : b.getAdminFee();
    BigDecimal totalHarga = b.getTotalHarga() == null ? BigDecimal.ZERO : b.getTotalHarga();
    BigDecimal grandTotal = totalHarga.add(adminFee);
    return new BookingResponse(
        b.getId(),
        b.getUserId(),
        b.getLapangan().getId(),
        b.getLapangan().getNama(),
        b.getTanggalMain(),
        b.getJamMulai(),
        b.getJamSelesai(),
        b.getStatus().name(),
        b.getTotalHarga(),
        b.getMetodePembayaran(),
        b.getNoHp(),
        b.getAdminFee(),
        grandTotal,
        b.getDpNominal(),
        b.getPaidAmount(),
        b.getBuktiBayarPath(),
        b.getVerifiedAt(),
        b.getInvoiceNumber(),
        b.getInvoiceIssuedAt(),
        b.getRefundStatus(),
        b.getRefundRequestedAt(),
        b.getRefundProcessedAt(),
        b.getRefundReason(),
        b.getRefundAmount(),
        b.getCreatedAt()
    );
  }
}

