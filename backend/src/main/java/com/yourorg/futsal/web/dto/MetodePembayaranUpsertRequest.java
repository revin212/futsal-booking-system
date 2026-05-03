package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record MetodePembayaranUpsertRequest(
    @NotBlank @Size(max = 32) String kode,
    @NotBlank @Size(max = 128) String namaLabel,
    @NotNull BigDecimal adminFee,
    @NotNull Integer urutan,
    @NotNull Boolean aktif
) {}
