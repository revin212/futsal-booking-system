package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.service.PaymentGatewayMockService;
import com.yourorg.futsal.web.exception.ApiException;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mock-gateway")
public class MockGatewayController {
  private final PaymentGatewayMockService paymentService;

  public MockGatewayController(PaymentGatewayMockService paymentService) {
    this.paymentService = paymentService;
  }

  @PostMapping("/{intentId}/pay")
  public void pay(@PathVariable UUID intentId, Authentication auth) {
    paymentService.markPaid(getUserId(auth), intentId);
  }

  @PostMapping("/{intentId}/fail")
  public void fail(@PathVariable UUID intentId, Authentication auth) {
    paymentService.markFailed(getUserId(auth), intentId);
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

