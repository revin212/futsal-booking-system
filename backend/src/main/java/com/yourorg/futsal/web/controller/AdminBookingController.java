package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.domain.enums.BookingStatus;
import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.service.BookingService;
import com.yourorg.futsal.web.dto.AdminVerifyBookingRequest;
import com.yourorg.futsal.web.dto.BookingResponse;
import com.yourorg.futsal.web.exception.ApiException;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/booking")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookingController {
  private final BookingRepository bookingRepo;
  private final BookingService bookingService;

  public AdminBookingController(BookingRepository bookingRepo, BookingService bookingService) {
    this.bookingRepo = bookingRepo;
    this.bookingService = bookingService;
  }

  @GetMapping
  public List<BookingResponse> listMenungguVerifikasi() {
    return bookingRepo.findByStatusWithLapanganOrderByCreatedAtDesc(BookingStatus.MENUNGGU_VERIFIKASI)
        .stream()
        .map(BookingResponse::from)
        .toList();
  }

  @GetMapping(params = {"start", "end"})
  public List<BookingResponse> listByDateRange(@RequestParam("start") LocalDate start, @RequestParam("end") LocalDate end) {
    LocalDate s = start;
    LocalDate e = end;
    if (s.isAfter(e)) {
      LocalDate tmp = s;
      s = e;
      e = tmp;
    }
    return bookingRepo.findByTanggalMainBetweenWithLapangan(s, e).stream().map(BookingResponse::from).toList();
  }

  @PatchMapping("/{id}/verifikasi")
  public BookingResponse verifikasi(@PathVariable Long id, @Valid @RequestBody AdminVerifyBookingRequest req) {
    String action = req.action().trim().toUpperCase();
    boolean approve;
    if ("APPROVE".equals(action)) {
      approve = true;
    } else if ("REJECT".equals(action)) {
      approve = false;
    } else {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Action harus APPROVE atau REJECT.");
    }
    return BookingResponse.from(bookingService.adminVerifikasi(id, approve));
  }

  @GetMapping("/{id}")
  public BookingResponse detail(@PathVariable Long id) {
    return bookingRepo.findByIdWithLapangan(id)
        .map(BookingResponse::from)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));
  }
}

