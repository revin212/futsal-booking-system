package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdminLoginRequest(
    @NotBlank(message = "email wajib diisi")
    @Email(message = "email tidak valid")
    String email,

    @NotBlank(message = "password wajib diisi")
    String password
) {}

