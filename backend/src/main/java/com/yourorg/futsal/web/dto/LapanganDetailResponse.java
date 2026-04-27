package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.Lapangan;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record LapanganDetailResponse(
    Long id,
    String nama,
    String tipe,
    String deskripsi,
    String fasilitas,
    BigDecimal hargaRegular,
    BigDecimal hargaPeakHour,
    BigDecimal hargaWeekend,
    boolean isAktif,
    Instant createdAt,
    List<FotoLapanganResponse> fotos,
    List<JamOperasionalResponse> jamOperasional
) {
  public static LapanganDetailResponse of(
      Lapangan l,
      List<FotoLapanganResponse> fotos,
      List<JamOperasionalResponse> jamOperasional
  ) {
    return new LapanganDetailResponse(
        l.getId(),
        l.getNama(),
        l.getTipe(),
        l.getDeskripsi(),
        l.getFasilitas(),
        l.getHargaRegular(),
        l.getHargaPeakHour(),
        l.getHargaWeekend(),
        l.isAktif(),
        l.getCreatedAt(),
        fotos,
        jamOperasional
    );
  }
}

