package com.yourorg.futsal.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "audit_log")
public class AuditLog {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "actor_user_id")
  private UUID actorUserId;

  @Column(name = "actor_role")
  private String actorRole;

  @Column(nullable = false)
  private String action;

  @Column(name = "entity_type", nullable = false)
  private String entityType;

  @Column(name = "entity_id", nullable = false)
  private String entityId;

  @Column(columnDefinition = "TEXT")
  private String metadata;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  public Long getId() {
    return id;
  }

  public UUID getActorUserId() {
    return actorUserId;
  }

  public void setActorUserId(UUID actorUserId) {
    this.actorUserId = actorUserId;
  }

  public String getActorRole() {
    return actorRole;
  }

  public void setActorRole(String actorRole) {
    this.actorRole = actorRole;
  }

  public String getAction() {
    return action;
  }

  public void setAction(String action) {
    this.action = action;
  }

  public String getEntityType() {
    return entityType;
  }

  public void setEntityType(String entityType) {
    this.entityType = entityType;
  }

  public String getEntityId() {
    return entityId;
  }

  public void setEntityId(String entityId) {
    this.entityId = entityId;
  }

  public String getMetadata() {
    return metadata;
  }

  public void setMetadata(String metadata) {
    this.metadata = metadata;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}

