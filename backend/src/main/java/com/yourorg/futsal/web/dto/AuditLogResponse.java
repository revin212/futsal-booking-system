package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.AuditLog;
import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
    Long id,
    UUID actorUserId,
    String actorRole,
    String action,
    String entityType,
    String entityId,
    String metadata,
    Instant createdAt
) {
  public static AuditLogResponse from(AuditLog a) {
    return new AuditLogResponse(
        a.getId(),
        a.getActorUserId(),
        a.getActorRole(),
        a.getAction(),
        a.getEntityType(),
        a.getEntityId(),
        a.getMetadata(),
        a.getCreatedAt()
    );
  }
}

