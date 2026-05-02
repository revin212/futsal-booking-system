package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record AdminLapanganUpsertRequest(
    @NotBlank String nama,
    @NotBlank String tipe,
    String deskripsi,
    List<String> fasilitas,
    @NotNull BigDecimal hargaRegular,
    @NotNull BigDecimal hargaPeakHour,
    @NotNull BigDecimal hargaWeekend,
    boolean isAktif
) {}
