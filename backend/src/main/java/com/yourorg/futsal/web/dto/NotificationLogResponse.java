package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.NotificationLog;
import java.time.Instant;

public record NotificationLogResponse(
    Long id,
    Long bookingId,
    String channel,
    String templateKey,
    String notificationType,
    String recipientType,
    String recipientValue,
    String message,
    String deliveryStatus,
    String errorMessage,
    String providerResponse,
    Instant createdAt
) {
  public static NotificationLogResponse from(NotificationLog n) {
    return new NotificationLogResponse(
        n.getId(),
        n.getBookingId(),
        n.getChannel(),
        n.getTemplateKey(),
        n.getNotificationType(),
        n.getRecipientType(),
        n.getRecipientValue(),
        n.getMessage(),
        n.getDeliveryStatus(),
        n.getErrorMessage(),
        n.getProviderResponse(),
        n.getCreatedAt()
    );
  }
}

