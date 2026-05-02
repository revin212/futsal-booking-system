package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RoleUserRequest(@NotBlank String role) {}
