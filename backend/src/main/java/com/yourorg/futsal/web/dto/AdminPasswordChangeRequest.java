package com.yourorg.futsal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminPasswordChangeRequest(
    @NotBlank String oldPassword,
    @NotBlank @Size(min = 8, max = 200) String newPassword
) {}
