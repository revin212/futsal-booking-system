package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminVerifyBookingRequest(
    @NotBlank String action,
    String note
) {}

