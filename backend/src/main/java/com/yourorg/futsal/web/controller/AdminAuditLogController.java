package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.domain.entity.AuditLog;
import com.yourorg.futsal.domain.repo.AuditLogRepository;
import com.yourorg.futsal.web.dto.AuditLogResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditLogController {
  private final AuditLogRepository auditRepo;

  public AdminAuditLogController(AuditLogRepository auditRepo) {
    this.auditRepo = auditRepo;
  }

  @GetMapping("/audit-log")
  public List<AuditLogResponse> latest(
      @RequestParam(defaultValue = "200") int limit,
      @RequestParam(required = false) String action,
      @RequestParam(required = false) String entityType,
      @RequestParam(required = false) String actorUserId,
      @RequestParam(required = false) LocalDate from,
      @RequestParam(required = false) LocalDate to
  ) {
    int safe = Math.min(Math.max(limit, 1), 500);
    List<AuditLog> rows = auditRepo.findLatest(PageRequest.of(0, safe));
    ZoneId z = ZoneId.of("Asia/Jakarta");
    Instant fromI = from == null ? null : from.atStartOfDay(z).toInstant();
    Instant toI = to == null ? null : to.plusDays(1).atStartOfDay(z).toInstant();
    return rows.stream()
        .filter(a -> action == null || action.isBlank() || (a.getAction() != null && a.getAction().equalsIgnoreCase(action.trim())))
        .filter(a -> entityType == null || entityType.isBlank() || (a.getEntityType() != null && a.getEntityType().equalsIgnoreCase(entityType.trim())))
        .filter(a -> {
          if (actorUserId == null || actorUserId.isBlank()) return true;
          return a.getActorUserId() != null && a.getActorUserId().toString().equalsIgnoreCase(actorUserId.trim());
        })
        .filter(a -> {
          if (fromI == null) return true;
          return !a.getCreatedAt().isBefore(fromI);
        })
        .filter(a -> {
          if (toI == null) return true;
          return a.getCreatedAt().isBefore(toI);
        })
        .map(AuditLogResponse::from)
        .toList();
  }
}

