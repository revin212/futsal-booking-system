package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.FotoLapangan;

public record FotoLapanganResponse(
    Long id,
    String filePath,
    boolean isUtama
) {
  public static FotoLapanganResponse from(FotoLapangan f) {
    return new FotoLapanganResponse(f.getId(), f.getFilePath(), f.isUtama());
  }
}

