package com.yourorg.futsal.auth;

import com.yourorg.futsal.domain.enums.UserRole;
import com.yourorg.futsal.domain.repo.AppUserRepository;
import com.yourorg.futsal.web.dto.AdminLoginRequest;
import com.yourorg.futsal.web.dto.AuthResponse;
import com.yourorg.futsal.web.exception.ApiException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AdminAuthController {
  private final AppUserRepository users;
  private final JwtService jwtService;
  private final PasswordEncoder passwordEncoder;

  public AdminAuthController(AppUserRepository users, JwtService jwtService, PasswordEncoder passwordEncoder) {
    this.users = users;
    this.jwtService = jwtService;
    this.passwordEncoder = passwordEncoder;
  }

  @PostMapping("/admin-login")
  public AuthResponse adminLogin(@Valid @RequestBody AdminLoginRequest req) {
    String email = req.email().trim().toLowerCase();
    var user = users.findByEmail(email)
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Email atau password salah."));

    if (user.isBlocked()) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Akun diblokir.");
    }
    if (user.getRole() != UserRole.ADMIN) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Akun ini bukan admin.");
    }

    String hash = user.getPasswordHash();
    if (hash == null || hash.isBlank() || !passwordEncoder.matches(req.password(), hash)) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Email atau password salah.");
    }

    String accessToken = jwtService.issueAccessToken(user);
    return AuthResponse.of(accessToken, user);
  }
}

