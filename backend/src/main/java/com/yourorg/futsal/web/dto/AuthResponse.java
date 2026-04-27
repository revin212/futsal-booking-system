package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.AppUser;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    UserResponse user
) {
  public static AuthResponse of(String accessToken, AppUser user) {
    return new AuthResponse(accessToken, null, UserResponse.from(user));
  }
}

