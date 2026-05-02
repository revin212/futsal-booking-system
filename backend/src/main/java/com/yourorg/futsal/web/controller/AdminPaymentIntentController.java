package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.domain.entity.PaymentIntent;
import com.yourorg.futsal.domain.repo.PaymentIntentRepository;
import com.yourorg.futsal.web.dto.PaymentIntentAdminResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/payment-intent")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentIntentController {
  private static final ZoneId JAKARTA = ZoneId.of("Asia/Jakarta");

  private final PaymentIntentRepository paymentIntentRepo;

  public AdminPaymentIntentController(PaymentIntentRepository paymentIntentRepo) {
    this.paymentIntentRepo = paymentIntentRepo;
  }

  @GetMapping
  public List<PaymentIntentAdminResponse> list(
      @RequestParam(required = false) LocalDate start,
      @RequestParam(required = false) LocalDate end,
      @RequestParam(required = false) String status
  ) {
    LocalDate s = start != null ? start : LocalDate.now(JAKARTA).minusDays(30);
    LocalDate e = end != null ? end : LocalDate.now(JAKARTA);
    if (s.isAfter(e)) {
      LocalDate t = s;
      s = e;
      e = t;
    }
    Instant startI = s.atStartOfDay(JAKARTA).toInstant();
    Instant endI = e.plusDays(1).atStartOfDay(JAKARTA).toInstant();
    List<PaymentIntent> rows = paymentIntentRepo.findByCreatedAtBetweenOrderByCreatedAtDesc(startI, endI);
    if (status != null && !status.isBlank()) {
      String st = status.trim().toUpperCase();
      rows = rows.stream().filter(p -> st.equals(p.getStatus())).toList();
    }
    return rows.stream().map(PaymentIntentAdminResponse::from).toList();
  }
}
