package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.entity.PaymentIntent;
import com.yourorg.futsal.domain.enums.BookingStatus;
import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.domain.repo.PaymentIntentRepository;
import com.yourorg.futsal.web.exception.ApiException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentGatewayMockService {
  private static final long PAYMENT_HOLD_MINUTES = 10;

  private final BookingRepository bookingRepo;
  private final PaymentIntentRepository intentRepo;
  private final BookingService bookingService;

  public PaymentGatewayMockService(
      BookingRepository bookingRepo,
      PaymentIntentRepository intentRepo,
      BookingService bookingService
  ) {
    this.bookingRepo = bookingRepo;
    this.intentRepo = intentRepo;
    this.bookingService = bookingService;
  }

  @Transactional
  public PaymentIntent createIntent(UUID userId, Long bookingId, String idempotencyKey) {
    var booking = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));
    if (!booking.getUserId().equals(userId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Akses ditolak.");
    }
    if (booking.getStatus() != BookingStatus.MENUNGGU_PEMBAYARAN) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Booking tidak dalam status MENUNGGU_PEMBAYARAN.");
    }

    // Avoid creating multiple active intents for the same booking.
    var existing = intentRepo.findLatestByBookingIdAndStatus(bookingId, "PENDING").orElse(null);
    if (existing != null) return existing;

    // Ensure booking pending is still active (not expired by scheduler window).
    Instant cutoff = Instant.now().minus(PAYMENT_HOLD_MINUTES, ChronoUnit.MINUTES);
    if (booking.getCreatedAt() != null && booking.getCreatedAt().isBefore(cutoff)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Booking sudah expired. Silakan buat booking ulang.");
    }

    BigDecimal totalHarga = booking.getTotalHarga() == null ? BigDecimal.ZERO : booking.getTotalHarga();
    BigDecimal adminFee = booking.getAdminFee() == null ? BigDecimal.ZERO : booking.getAdminFee();
    BigDecimal amount = totalHarga.add(adminFee);

    PaymentIntent p = new PaymentIntent();
    p.setBookingId(bookingId);
    p.setProvider("MOCK_GATEWAY");
    p.setStatus("PENDING");
    p.setAmount(amount);
    p.setCurrency("IDR");
    p.setIdempotencyKey(idempotencyKey == null ? null : idempotencyKey.trim());
    p.setExternalRef("BOOKING-" + bookingId);
    return intentRepo.save(p);
  }

  @Transactional(readOnly = true)
  public PaymentIntent getIntentForUser(UUID userId, UUID intentId) {
    var p = intentRepo.findById(intentId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Payment intent tidak ditemukan."));
    var booking = bookingRepo.findById(p.getBookingId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));
    if (!booking.getUserId().equals(userId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Akses ditolak.");
    }
    return p;
  }

  @Transactional
  public void markPaid(UUID userId, UUID intentId) {
    var p = getIntentForUser(userId, intentId);
    if ("SUCCEEDED".equals(p.getStatus())) return;
    if (!"PENDING".equals(p.getStatus())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Payment intent tidak dalam status PENDING.");
    }
    int updated = intentRepo.compareAndSetStatus(intentId, "PENDING", "SUCCEEDED");
    if (updated == 0) return;
    bookingService.mockPay(userId, p.getBookingId());
  }

  @Transactional
  public void markFailed(UUID userId, UUID intentId) {
    var p = getIntentForUser(userId, intentId);
    if (!"PENDING".equals(p.getStatus())) return;
    intentRepo.compareAndSetStatus(intentId, "PENDING", "FAILED");
  }
}

