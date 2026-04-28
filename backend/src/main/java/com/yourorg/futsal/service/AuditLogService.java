package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.entity.AuditLog;
import com.yourorg.futsal.domain.repo.AuditLogRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {
  private final AuditLogRepository auditRepo;

  public AuditLogService(AuditLogRepository auditRepo) {
    this.auditRepo = auditRepo;
  }

  @Transactional
  public void log(UUID actorUserId, String actorRole, String action, String entityType, String entityId, String metadata) {
    AuditLog a = new AuditLog();
    a.setActorUserId(actorUserId);
    a.setActorRole(actorRole);
    a.setAction(action);
    a.setEntityType(entityType);
    a.setEntityId(entityId);
    a.setMetadata(metadata);
    auditRepo.save(a);
  }
}

