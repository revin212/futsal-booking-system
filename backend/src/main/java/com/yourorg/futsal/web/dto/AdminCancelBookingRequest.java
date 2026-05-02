package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminCancelBookingRequest(@NotBlank String alasan) {}
