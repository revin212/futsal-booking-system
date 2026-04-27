package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(
    @NotBlank(message = "idToken wajib diisi")
    String idToken
) {}

