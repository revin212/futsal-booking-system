package com.yourorg.futsal.web.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
    Map<String, Object> errors = new HashMap<>();
    for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
      errors.put(fe.getField(), fe.getDefaultMessage());
    }
    return build(HttpStatus.BAD_REQUEST, "Validasi gagal", ex.getMessage(), req.getRequestURI(), errors);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
    return build(HttpStatus.FORBIDDEN, "Forbidden", "Akses ditolak", req.getRequestURI(), null);
  }

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiError> handleApi(ApiException ex, HttpServletRequest req) {
    return build(ex.status(), ex.title(), ex.getMessage(), req.getRequestURI(), ex.errors());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleGeneric(Exception ex, HttpServletRequest req) {
    log.error("Unhandled exception for {}", req.getRequestURI(), ex);
    return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "Terjadi kesalahan.", req.getRequestURI(), null);
  }

  private ResponseEntity<ApiError> build(HttpStatus status, String title, String detail, String instance, Map<String, Object> errors) {
    ApiError body = new ApiError(
        "about:blank",
        title,
        status.value(),
        detail,
        instance,
        Instant.now(),
        errors
    );
    return ResponseEntity.status(status)
        .header("Content-Type", "application/problem+json")
        .body(body);
  }
}

