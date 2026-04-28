package com.yourorg.futsal.auth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.yourorg.futsal.domain.entity.AppUser;
import com.yourorg.futsal.domain.enums.UserRole;
import com.yourorg.futsal.domain.repo.AppUserRepository;
import com.yourorg.futsal.web.dto.AuthResponse;
import com.yourorg.futsal.web.dto.GoogleAuthRequest;
import com.yourorg.futsal.web.exception.ApiException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class GoogleAuthController {
  private final GoogleTokenVerifierService verifier;
  private final AppUserRepository users;
  private final JwtService jwtService;

  public GoogleAuthController(GoogleTokenVerifierService verifier, AppUserRepository users, JwtService jwtService) {
    this.verifier = verifier;
    this.users = users;
    this.jwtService = jwtService;
  }

  @PostMapping("/google")
  public AuthResponse google(@Valid @RequestBody GoogleAuthRequest req) {
    GoogleIdToken.Payload payload = verifier.verify(req.idToken());
    if (payload == null) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Google token tidak valid.");
    }

    String email = payload.getEmail();
    if (email == null || email.isBlank()) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Email Google tidak ditemukan.");
    }

    String normalizedEmail = email.trim().toLowerCase();
    AppUser user = users.findByEmail(normalizedEmail).orElseGet(() -> {
      AppUser u = new AppUser();
      u.setEmail(normalizedEmail);
      u.setNamaLengkap(payload.get("name") != null ? payload.get("name").toString() : "User");
      u.setFotoProfil(payload.get("picture") != null ? payload.get("picture").toString() : null);
      u.setRole(UserRole.USER); // enforce: Google OAuth provisions USER accounts only
      return users.save(u);
    });

    if (user.isBlocked()) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Akun diblokir.");
    }
    if (user.getRole() == UserRole.ADMIN) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Akun admin harus login lewat Admin Login.");
    }

    String accessToken = jwtService.issueAccessToken(user);
    return AuthResponse.of(accessToken, user);
  }
}

