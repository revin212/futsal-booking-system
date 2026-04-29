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
    @Pattern(
        regexp = "(?i)^(QRIS|TRANSFER|EMONEY|CASH)$",
        message = "metode pembayaran harus QRIS, TRANSFER, EMONEY, atau CASH"
    )
    String metodePembayaran,
    @NotBlank(message = "noHp wajib diisi")
    @Pattern(
        regexp = "^(\\+62|62|0)\\d{9,13}$",
        message = "Format noHp tidak valid. Gunakan +62..., 62..., atau 0..."
    )
    String noHp
) {}

