package com.yourorg.futsal.web.dto;

import java.time.LocalDate;
import java.util.List;

public record SlotHariIniResponse(
    Long lapanganId,
    String lapanganNama,
    LocalDate tanggal,
    List<SlotResponse> slots
) {}

