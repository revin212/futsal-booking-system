package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public record AdminRescheduleBookingRequest(
    @NotNull LocalDate tanggalMain,
    @NotNull LocalTime jamMulai,
    @NotNull @Min(1) Integer durasiJam
) {}
