package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RefundCreateRequest(
    @NotBlank(message = "reason wajib diisi")
    @Size(min = 10, message = "reason minimal 10 karakter")
    String reason
) {}

