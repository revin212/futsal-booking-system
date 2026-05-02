package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.PaymentIntent;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentIntentAdminResponse(
    UUID id,
    Long bookingId,
    String provider,
    String status,
    BigDecimal amount,
    String currency,
    Instant createdAt,
    Instant updatedAt
) {
  public static PaymentIntentAdminResponse from(PaymentIntent p) {
    return new PaymentIntentAdminResponse(
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
