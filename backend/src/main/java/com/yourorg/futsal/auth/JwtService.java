package com.yourorg.futsal.auth;

import com.yourorg.futsal.config.JwtConfig;
import com.yourorg.futsal.domain.entity.AppUser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final JwtConfig config;
  private final SecretKey key;

  public JwtService(JwtConfig config) {
    this.config = config;
    this.key = Keys.hmacShaKeyFor(config.secret().getBytes(StandardCharsets.UTF_8));
  }

  public String issueAccessToken(AppUser user) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(config.accessTtlMinutes() * 60);
    return Jwts.builder()
        .issuer(config.issuer())
        .subject(user.getId().toString())
        .issuedAt(Date.from(now))
        .expiration(Date.from(exp))
        .claims(Map.of(
            "email", user.getEmail(),
            "role", user.getRole().name(),
            "name", user.getNamaLengkap()
        ))
        .signWith(key)
        .compact();
  }
}

