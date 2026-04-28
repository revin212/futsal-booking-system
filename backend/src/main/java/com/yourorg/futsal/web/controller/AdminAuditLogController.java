package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.domain.repo.AuditLogRepository;
import com.yourorg.futsal.web.dto.AuditLogResponse;
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
  public List<AuditLogResponse> latest(@RequestParam(defaultValue = "50") int limit) {
    int safe = Math.min(Math.max(limit, 1), 200);
    return auditRepo.findLatest(PageRequest.of(0, safe)).stream().map(AuditLogResponse::from).toList();
  }
}

