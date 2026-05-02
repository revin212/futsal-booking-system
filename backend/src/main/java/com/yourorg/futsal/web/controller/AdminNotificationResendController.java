package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.service.WhatsappNotificationService;
import com.yourorg.futsal.web.dto.NotificationLogResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/notification-log")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationResendController {
  private final WhatsappNotificationService wa;

  public AdminNotificationResendController(WhatsappNotificationService wa) {
    this.wa = wa;
  }

  @PostMapping("/{id}/resend")
  public NotificationLogResponse resend(@PathVariable Long id) {
    return NotificationLogResponse.from(wa.resendFromLog(id));
  }
}
