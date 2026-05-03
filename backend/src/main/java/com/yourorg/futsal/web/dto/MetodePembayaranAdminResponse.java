package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.MetodePembayaran;
import java.math.BigDecimal;
import java.time.Instant;

public record MetodePembayaranAdminResponse(
    long id,
    String kode,
    String namaLabel,
    BigDecimal adminFee,
    int urutan,
    boolean aktif,
    boolean tanpaPaymentGateway,
    Instant createdAt,
    Instant updatedAt
) {
  public static MetodePembayaranAdminResponse from(MetodePembayaran m) {
    return new MetodePembayaranAdminResponse(
        m.getId(),
        m.getKode(),
        m.getNamaLabel(),
        m.getAdminFee() != null ? m.getAdminFee() : java.math.BigDecimal.ZERO,
        m.getUrutan(),
        m.isAktif(),
        m.isTanpaPaymentGateway(),
        m.getCreatedAt(),
        m.getUpdatedAt());
  }
}
