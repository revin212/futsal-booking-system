package com.yourorg.futsal.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public record InvoiceResponse(
    String invoiceNumber,
    Instant invoiceIssuedAt,
    Long bookingId,
    String lapanganNama,
    LocalDate tanggalMain,
    LocalTime jamMulai,
    LocalTime jamSelesai,
    BigDecimal totalHarga,
    BigDecimal adminFee,
    BigDecimal grandTotal,
    String status,
    Instant paidAt
) {}

