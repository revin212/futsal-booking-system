package com.yourorg.futsal.web.dto;

import java.math.BigDecimal;

public record AdminFinanceSummaryRow(
    String key,
    long count,
    BigDecimal totalHarga,
    BigDecimal adminFee,
    BigDecimal paidAmount
) {}
