package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.NotNull;

public record CreatePaymentIntentRequest(
    @NotNull(message = "bookingId wajib diisi")
    Long bookingId
) {}

