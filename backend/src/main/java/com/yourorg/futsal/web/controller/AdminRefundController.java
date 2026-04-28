package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.service.BookingService;
import com.yourorg.futsal.web.dto.AdminRefundActionRequest;
import com.yourorg.futsal.web.dto.BookingResponse;
import com.yourorg.futsal.web.exception.ApiException;
import jakarta.validation.Valid;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
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
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/api/admin/refund")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRefundController {
  private static final ZoneId JAKARTA = ZoneId.of("Asia/Jakarta");
  private final BookingRepository bookingRepo;
  private final BookingService bookingService;

  public AdminRefundController(BookingRepository bookingRepo, BookingService bookingService) {
    this.bookingRepo = bookingRepo;
    this.bookingService = bookingService;
  }

  @GetMapping
  public List<BookingResponse> list(
      @RequestParam(defaultValue = "PENDING") String status,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end
  ) {
    String s = status == null ? "PENDING" : status.trim().toUpperCase();
    if (start != null && end != null) {
      Instant startAt = start.atStartOfDay(JAKARTA).toInstant();
      Instant endExclusive = end.plusDays(1).atStartOfDay(JAKARTA).toInstant();
      return bookingRepo.findRefundByStatusWithLapanganAndRequestedAtBetween(s, startAt, endExclusive)
          .stream().map(BookingResponse::from).toList();
    }
    return bookingRepo.findRefundByStatusWithLapangan(s).stream().map(BookingResponse::from).toList();
  }

  @GetMapping("/{bookingId}")
  public BookingResponse detail(@PathVariable Long bookingId) {
    var booking = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));
    return BookingResponse.from(booking);
  }

  @PatchMapping("/{bookingId}")
  public BookingResponse action(@PathVariable Long bookingId, @Valid @RequestBody AdminRefundActionRequest req) {
    String action = req.action().trim().toUpperCase();
    boolean approve;
    if ("APPROVE".equals(action)) {
      approve = true;
    } else if ("REJECT".equals(action)) {
      approve = false;
    } else {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Action harus APPROVE atau REJECT.");
    }
    return BookingResponse.from(bookingService.adminProcessRefund(bookingId, approve, req.note()));
  }
}

