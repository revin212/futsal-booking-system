package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.AppUser;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String email,
    String namaLengkap,
    String noHp,
    String fotoProfil,
    Instant createdAt,
    boolean isBlocked,
    String role
) {
  public static UserResponse from(AppUser u) {
    return new UserResponse(
        u.getId(),
        u.getEmail(),
        u.getNamaLengkap(),
        u.getNoHp(),
        u.getFotoProfil(),
        u.getCreatedAt(),
        u.isBlocked(),
        u.getRole().name()
    );
  }
}

