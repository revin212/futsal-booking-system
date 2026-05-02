package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

public record JamOperasionalUpsertItem(
    @NotNull @Min(0) @Max(6) Integer hariKe,
    @NotNull LocalTime jamBuka,
    @NotNull LocalTime jamTutup,
    boolean isAktif
) {}
