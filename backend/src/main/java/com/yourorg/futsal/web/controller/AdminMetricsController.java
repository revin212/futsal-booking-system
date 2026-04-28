package com.yourorg.futsal.web.controller;

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
  public List<NotificationLogResponse> latestNotificationLog(@RequestParam(defaultValue = "50") int limit) {
    int safe = Math.min(Math.max(limit, 1), 200);
    return notifRepo.findLatest(PageRequest.of(0, safe)).stream().map(NotificationLogResponse::from).toList();
  }
}

