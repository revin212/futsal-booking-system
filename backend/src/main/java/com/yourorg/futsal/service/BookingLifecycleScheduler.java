package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.enums.BookingStatus;
import com.yourorg.futsal.domain.repo.BookingRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BookingLifecycleScheduler {
  private static final Logger log = LoggerFactory.getLogger(BookingLifecycleScheduler.class);
  private static final ZoneId JAKARTA = ZoneId.of("Asia/Jakarta");
  private static final long PAYMENT_HOLD_MINUTES = 10;

  private final BookingRepository bookingRepo;
  private final WhatsappNotificationService waService;

  public BookingLifecycleScheduler(BookingRepository bookingRepo, WhatsappNotificationService waService) {
    this.bookingRepo = bookingRepo;
    this.waService = waService;
  }

  @Scheduled(fixedDelay = 60_000)
  @Transactional
  public void autoMarkSelesai() {
    ZonedDateTime now = ZonedDateTime.now(JAKARTA);
    int updated = bookingRepo.markCompletedAfterEndTime(
        BookingStatus.LUNAS,
        BookingStatus.SELESAI,
        now.toLocalDate(),
        now.toLocalTime()
    );
    if (updated > 0) {
      log.info("Auto-marked {} booking(s) as SELESAI", updated);
    }
  }

  // Reminder harian jam 18:00 WIB untuk booking LUNAS besok.
  @Scheduled(cron = "0 0 18 * * *", zone = "Asia/Jakarta")
  @Transactional
  public void sendReminderForTomorrow() {
    LocalDate tomorrow = LocalDate.now(JAKARTA).plusDays(1);
    var list = bookingRepo.findByStatusAndTanggalMainWithLapangan(BookingStatus.LUNAS, tomorrow);
    if (list.isEmpty()) return;

    // Skip reminder jika booking sudah kedaluwarsa "pending" (tidak relevan di sini), dan hindari spam via log check.
    for (var b : list) {
      try {
        waService.notifyReminder(b);
      } catch (Exception e) {
        log.warn("Failed to send reminder for booking id={}", b.getId(), e);
      }
    }
  }

  // Metrics helper: active pending cutoff.
  public Instant pendingCutoff() {
    return Instant.now().minus(PAYMENT_HOLD_MINUTES, ChronoUnit.MINUTES);
  }
}

