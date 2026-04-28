package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.service.PaymentGatewayMockService;
import com.yourorg.futsal.web.dto.CreatePaymentIntentRequest;
import com.yourorg.futsal.web.dto.PaymentIntentResponse;
import com.yourorg.futsal.web.exception.ApiException;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payment-intent")
public class PaymentIntentController {
  private final PaymentGatewayMockService paymentService;

  public PaymentIntentController(PaymentGatewayMockService paymentService) {
    this.paymentService = paymentService;
  }

  @PostMapping
  public PaymentIntentResponse create(@Valid @RequestBody CreatePaymentIntentRequest req,
                                      @RequestHeader(name = "Idempotency-Key", required = false) String idemKey,
                                      Authentication auth) {
    UUID userId = getUserId(auth);
    return PaymentIntentResponse.from(paymentService.createIntent(userId, req.bookingId(), idemKey));
  }

  @GetMapping("/{id}")
  public PaymentIntentResponse detail(@PathVariable UUID id, Authentication auth) {
    UUID userId = getUserId(auth);
    return PaymentIntentResponse.from(paymentService.getIntentForUser(userId, id));
  }

  private UUID getUserId(Authentication auth) {
    if (auth == null || auth.getPrincipal() == null) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Silakan login.");
    }
    try {
      return UUID.fromString(String.valueOf(auth.getPrincipal()));
    } catch (Exception e) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Token tidak valid.");
    }
  }
}

