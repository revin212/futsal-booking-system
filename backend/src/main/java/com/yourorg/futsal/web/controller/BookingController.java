package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.service.BookingService;
import com.yourorg.futsal.web.dto.BookingResponse;
import com.yourorg.futsal.web.dto.CreateBookingRequest;
import com.yourorg.futsal.web.dto.MockPayBookingRequest;
import com.yourorg.futsal.web.exception.ApiException;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

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

  @GetMapping("/{id}")
  public BookingResponse detail(@PathVariable Long id, Authentication auth) {
    UUID userId = getUserId(auth);
    return BookingResponse.from(bookingService.getBookingDetailForUser(userId, id));
  }

  @PatchMapping("/{id}/batalkan")
  public BookingResponse cancel(@PathVariable Long id, Authentication auth) {
    UUID userId = getUserId(auth);
    return BookingResponse.from(bookingService.cancelBooking(userId, id));
  }

  @PostMapping(value = "/{id}/upload-bukti", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public BookingResponse uploadBukti(@PathVariable Long id, @RequestPart("file") MultipartFile file, Authentication auth) {
    UUID userId = getUserId(auth);
    return BookingResponse.from(bookingService.uploadBuktiBayar(userId, id, file));
  }

  @PatchMapping("/{id}/konfirmasi-bayar")
  public BookingResponse konfirmasiBayar(@PathVariable Long id, Authentication auth) {
    UUID userId = getUserId(auth);
    return BookingResponse.from(bookingService.konfirmasiBayar(userId, id));
  }

  @PostMapping("/{id}/mock-pay")
  public BookingResponse mockPay(@PathVariable Long id, @Valid @RequestBody MockPayBookingRequest req, Authentication auth) {
    UUID userId = getUserId(auth);
    return BookingResponse.from(bookingService.mockPay(userId, id, req.method()));
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

