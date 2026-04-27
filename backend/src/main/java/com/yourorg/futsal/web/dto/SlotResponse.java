package com.yourorg.futsal.web.dto;

import java.math.BigDecimal;

public record SlotResponse(
    String jam,
    boolean tersedia,
    BigDecimal harga
) {}

