package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import java.time.LocalTime;

public record CreateBookingRequest(
    @NotNull Long lapanganId,
    @NotNull LocalDate tanggalMain,
    @NotNull LocalTime jamMulai,
    @NotNull @Min(1) Integer durasiJam,
    @NotBlank
    @Pattern(regexp = "(?i)^[A-Z0-9_-]{1,32}$", message = "Kode metode pembayaran tidak valid.")
    String metodePembayaran,
    @Pattern(
        regexp = "^(\\+62|62|0)\\d{9,13}$",
        message = "Format noHp tidak valid. Gunakan +62..., 62..., atau 0..."
    )
    String noHp
) {}

