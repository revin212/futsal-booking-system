package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.domain.entity.NotificationLog;
import com.yourorg.futsal.domain.enums.BookingStatus;
import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.domain.repo.NotificationLogRepository;
import com.yourorg.futsal.web.dto.AdminMetricsResponse;
import com.yourorg.futsal.web.dto.NotificationLogResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
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
public class AdminMetricsController {
  private static final ZoneId JAKARTA = ZoneId.of("Asia/Jakarta");
  private static final long PAYMENT_HOLD_MINUTES = 10;

  private final BookingRepository bookingRepo;
  private final NotificationLogRepository notifRepo;

  public AdminMetricsController(BookingRepository bookingRepo, NotificationLogRepository notifRepo) {
    this.bookingRepo = bookingRepo;
    this.notifRepo = notifRepo;
  }

  @GetMapping("/metrics")
  public AdminMetricsResponse metrics() {
    Instant cutoff = Instant.now().minus(PAYMENT_HOLD_MINUTES, ChronoUnit.MINUTES);
    LocalDate today = LocalDate.now(JAKARTA);
    long pendingAktif = bookingRepo.countActivePending(BookingStatus.MENUNGGU_PEMBAYARAN, cutoff);
    long lunasHariIni = bookingRepo.countByStatusAndTanggalMain(BookingStatus.LUNAS, today);
    long selesaiHariIni = bookingRepo.countByStatusAndTanggalMain(BookingStatus.SELESAI, today);
    return new AdminMetricsResponse(pendingAktif, lunasHariIni, selesaiHariIni);
  }

  @GetMapping("/notification-log")
  public List<NotificationLogResponse> latestNotificationLog(
      @RequestParam(defaultValue = "200") int limit,
      @RequestParam(required = false) String notificationType,
      @RequestParam(required = false) String recipientType,
      @RequestParam(required = false) LocalDate from,
      @RequestParam(required = false) LocalDate to
  ) {
    int safe = Math.min(Math.max(limit, 1), 500);
    List<NotificationLog> rows = notifRepo.findLatest(PageRequest.of(0, safe));
    ZoneId z = ZoneId.of("Asia/Jakarta");
    Instant fromI = from == null ? null : from.atStartOfDay(z).toInstant();
    Instant toI = to == null ? null : to.plusDays(1).atStartOfDay(z).toInstant();
    return rows.stream()
        .filter(n -> notificationType == null || notificationType.isBlank()
            || (n.getNotificationType() != null && n.getNotificationType().equalsIgnoreCase(notificationType.trim())))
        .filter(n -> recipientType == null || recipientType.isBlank()
            || (n.getRecipientType() != null && n.getRecipientType().equalsIgnoreCase(recipientType.trim())))
        .filter(n -> fromI == null || !n.getCreatedAt().isBefore(fromI))
        .filter(n -> toI == null || n.getCreatedAt().isBefore(toI))
        .map(NotificationLogResponse::from)
        .toList();
  }
}

