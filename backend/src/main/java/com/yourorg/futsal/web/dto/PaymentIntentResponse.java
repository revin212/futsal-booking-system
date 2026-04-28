package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.PaymentIntent;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentIntentResponse(
    UUID id,
    Long bookingId,
    String provider,
    String status,
    BigDecimal amount,
    String currency,
    Instant createdAt,
    Instant updatedAt
) {
  public static PaymentIntentResponse from(PaymentIntent p) {
    return new PaymentIntentResponse(
        p.getId(),
        p.getBookingId(),
        p.getProvider(),
        p.getStatus(),
        p.getAmount(),
        p.getCurrency(),
        p.getCreatedAt(),
        p.getUpdatedAt()
    );
  }
}

