package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.service.BookingService;
import com.yourorg.futsal.web.dto.BookingResponse;
import com.yourorg.futsal.web.dto.CreateBookingRequest;
import com.yourorg.futsal.web.exception.ApiException;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/booking")
public class BookingController {
  private final BookingService bookingService;

  public BookingController(BookingService bookingService) {
    this.bookingService = bookingService;
  }

  @PostMapping
  public BookingResponse create(@Valid @RequestBody CreateBookingRequest req, Authentication auth) {
    UUID userId = getUserId(auth);
    var booking = bookingService.createBooking(
        userId,
        req.lapanganId(),
        req.tanggalMain(),
        req.jamMulai(),
        req.durasiJam()
    );
    return BookingResponse.from(booking);
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

