package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.Lapangan;
import java.math.BigDecimal;
import java.time.Instant;

public record LapanganListItemResponse(
    Long id,
    String nama,
    String tipe,
    String deskripsi,
    String fasilitas,
    BigDecimal hargaMulaiDari,
    BigDecimal hargaRegular,
    BigDecimal hargaPeakHour,
    BigDecimal hargaWeekend,
    boolean isAktif,
    Instant createdAt,
    FotoLapanganResponse fotoUtama
) {
  public static LapanganListItemResponse of(Lapangan l, FotoLapanganResponse fotoUtama) {
    BigDecimal mulai = l.getHargaRegular();
    if (l.getHargaWeekend() != null && l.getHargaWeekend().compareTo(mulai) < 0) mulai = l.getHargaWeekend();
    if (l.getHargaPeakHour() != null && l.getHargaPeakHour().compareTo(mulai) < 0) mulai = l.getHargaPeakHour();

    return new LapanganListItemResponse(
        l.getId(),
        l.getNama(),
        l.getTipe(),
        l.getDeskripsi(),
        l.getFasilitas(),
        mulai,
        l.getHargaRegular(),
        l.getHargaPeakHour(),
        l.getHargaWeekend(),
        l.isAktif(),
        l.getCreatedAt(),
        fotoUtama
    );
  }
}

