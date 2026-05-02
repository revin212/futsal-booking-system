package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.auth.SecurityUtils;
import com.yourorg.futsal.domain.entity.PengaturanSistem;
import com.yourorg.futsal.domain.repo.PengaturanSistemRepository;
import com.yourorg.futsal.service.AuditLogService;
import com.yourorg.futsal.web.dto.SettingsPatchRequest;
import com.yourorg.futsal.web.dto.SettingsResponse;
import jakarta.validation.Valid;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/settings")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSettingsController {
  private final PengaturanSistemRepository settingsRepo;
  private final AuditLogService auditLogService;

  public AdminSettingsController(PengaturanSistemRepository settingsRepo, AuditLogService auditLogService) {
    this.settingsRepo = settingsRepo;
    this.auditLogService = auditLogService;
  }

  @GetMapping
  public SettingsResponse getAll() {
    Map<String, String> entries = new LinkedHashMap<>();
    for (PengaturanSistem s : settingsRepo.findAll().stream().sorted((a, b) -> a.getKey().compareToIgnoreCase(b.getKey())).toList()) {
      entries.put(s.getKey(), s.getValue());
    }
    return new SettingsResponse(entries);
  }

  @PatchMapping
  @Transactional
  public SettingsResponse patch(@Valid @RequestBody SettingsPatchRequest req) {
    for (SettingsPatchRequest.SettingEntry e : req.entries()) {
      PengaturanSistem row = settingsRepo.findByKey(e.key())
          .orElseGet(() -> {
            PengaturanSistem n = new PengaturanSistem();
            n.setKey(e.key());
            return n;
          });
      row.setValue(e.value() == null ? "" : e.value());
      settingsRepo.save(row);
    }
    auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "SETTINGS_PATCH", "PengaturanSistem", "bulk", "{}");
    return getAll();
  }
}
