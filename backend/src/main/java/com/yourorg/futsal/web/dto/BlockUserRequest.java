package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.NotNull;

public record BlockUserRequest(@NotNull Boolean isBlocked) {}
