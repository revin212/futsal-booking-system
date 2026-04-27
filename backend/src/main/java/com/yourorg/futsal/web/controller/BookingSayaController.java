package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.service.BookingService;
import com.yourorg.futsal.web.dto.BookingResponse;
import com.yourorg.futsal.web.exception.ApiException;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/booking-saya")
public class BookingSayaController {
  private final BookingService bookingService;

  public BookingSayaController(BookingService bookingService) {
    this.bookingService = bookingService;
  }

  @GetMapping
  public List<BookingResponse> list(Authentication auth) {
    UUID userId = getUserId(auth);
    return bookingService.listByUser(userId).stream().map(BookingResponse::from).toList();
  }

  private UUID getUserId(Authentication auth) {
    if (auth == null || auth.getPrincipal() == null) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Silakan login.");
    }
    try {
      return UUID.fromString(String.valueOf(auth.getPrincipal()));
    } catch (Exception e) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Token tidak valid.");
    }
  }
}

