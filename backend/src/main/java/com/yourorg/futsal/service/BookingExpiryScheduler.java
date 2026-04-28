package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.enums.BookingStatus;
import com.yourorg.futsal.domain.repo.BookingRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BookingExpiryScheduler {
  private static final long PAYMENT_HOLD_MINUTES = 10;

  private final BookingRepository bookingRepo;

  public BookingExpiryScheduler(BookingRepository bookingRepo) {
    this.bookingRepo = bookingRepo;
  }

  @Scheduled(fixedDelay = 60_000)
  @Transactional
  public void expirePendingPayments() {
    Instant cutoff = Instant.now().minus(PAYMENT_HOLD_MINUTES, ChronoUnit.MINUTES);
    bookingRepo.expirePendingPayments(BookingStatus.MENUNGGU_PEMBAYARAN, BookingStatus.DIBATALKAN, cutoff);
  }
}

