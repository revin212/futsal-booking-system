package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.enums.BookingStatus;
import com.yourorg.futsal.domain.repo.PaymentIntentRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PaymentIntentExpiryScheduler {
  private static final Logger log = LoggerFactory.getLogger(PaymentIntentExpiryScheduler.class);
  private static final long PAYMENT_HOLD_MINUTES = 10;

  private final PaymentIntentRepository intentRepo;

  public PaymentIntentExpiryScheduler(PaymentIntentRepository intentRepo) {
    this.intentRepo = intentRepo;
  }

  @Scheduled(fixedDelay = 60_000)
  @Transactional
  public void expireIntentsForExpiredBookings() {
    Instant cutoff = Instant.now().minus(PAYMENT_HOLD_MINUTES, ChronoUnit.MINUTES);
    int updated = intentRepo.expirePendingByBookingState(BookingStatus.MENUNGGU_PEMBAYARAN, cutoff);
    if (updated > 0) {
      log.info("Expired {} payment intent(s) due to booking state", updated);
    }
  }
}

