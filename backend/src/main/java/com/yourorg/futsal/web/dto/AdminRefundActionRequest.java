package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminRefundActionRequest(
    @NotBlank(message = "action wajib diisi")
    String action,
    String note
) {}

