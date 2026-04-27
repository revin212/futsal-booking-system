package com.yourorg.futsal.web.exception;

import java.util.Map;
import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
  private final HttpStatus status;
  private final String title;
  private final Map<String, Object> errors;

  public ApiException(HttpStatus status, String title, String message) {
    super(message);
    this.status = status;
    this.title = title;
    this.errors = null;
  }

  public ApiException(HttpStatus status, String title, String message, Map<String, Object> errors) {
    super(message);
    this.status = status;
    this.title = title;
    this.errors = errors;
  }

  public HttpStatus status() {
    return status;
  }

  public String title() {
    return title;
  }

  public Map<String, Object> errors() {
    return errors;
  }
}

