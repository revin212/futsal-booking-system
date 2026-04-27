package com.yourorg.futsal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public record JwtConfig(
    String secret,
    String issuer,
    long accessTtlMinutes
) {}

