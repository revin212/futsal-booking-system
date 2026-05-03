package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.MetodePembayaran;
import java.math.BigDecimal;

public record MetodePembayaranPublicResponse(
    String kode,
    String namaLabel,
    BigDecimal adminFee,
    boolean tanpaPaymentGateway
) {
  public static MetodePembayaranPublicResponse from(MetodePembayaran m) {
    return new MetodePembayaranPublicResponse(
        m.getKode(),
        m.getNamaLabel(),
        m.getAdminFee() != null ? m.getAdminFee() : BigDecimal.ZERO,
        m.isTanpaPaymentGateway());
  }
}
