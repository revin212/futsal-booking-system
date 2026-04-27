package com.yourorg.futsal.web.exception;

import java.time.Instant;
import java.util.Map;

public record ApiError(
    String type,
    String title,
    int status,
    String detail,
    String instance,
    Instant timestamp,
    Map<String, Object> errors
) {}

