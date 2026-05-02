package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AdminRefundProcessRequest(
    @NotBlank String action,
    BigDecimal processedAmount,
    String note
) {
  public boolean approve() {
    return "APPROVE".equalsIgnoreCase(action.trim());
  }

  public boolean reject() {
    return "REJECT".equalsIgnoreCase(action.trim());
  }
}
