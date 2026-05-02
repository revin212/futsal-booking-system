package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.auth.SecurityUtils;
import com.yourorg.futsal.domain.entity.Booking;
import com.yourorg.futsal.domain.enums.BookingStatus;
import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.service.BookingService;
import com.yourorg.futsal.web.dto.AdminCancelBookingRequest;
import com.yourorg.futsal.web.dto.AdminRefundCreateRequest;
import com.yourorg.futsal.web.dto.AdminRefundProcessRequest;
import com.yourorg.futsal.web.dto.AdminRescheduleBookingRequest;
import com.yourorg.futsal.web.dto.AdminVerifyBookingRequest;
import com.yourorg.futsal.web.dto.BookingResponse;
import com.yourorg.futsal.web.exception.ApiException;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
  public List<BookingResponse> listByDateRange(
      @RequestParam("start") LocalDate start,
      @RequestParam("end") LocalDate end,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) Long lapanganId,
      @RequestParam(required = false) String q
  ) {
    LocalDate s = start;
    LocalDate e = end;
    if (s.isAfter(e)) {
      LocalDate tmp = s;
      s = e;
      e = tmp;
    }
    Stream<Booking> stream = bookingRepo.findByTanggalMainBetweenWithLapangan(s, e).stream();
    if (status != null && !status.isBlank()) {
      String st = status.trim().toUpperCase();
      stream = stream.filter(b -> b.getStatus().name().equals(st));
    }
    if (lapanganId != null) {
      stream = stream.filter(b -> b.getLapangan().getId().equals(lapanganId));
    }
    if (q != null && !q.isBlank()) {
      String needle = q.trim().toLowerCase();
      stream = stream.filter(b -> {
        if (b.getNoHp() != null && b.getNoHp().toLowerCase().contains(needle)) {
          return true;
        }
        if (b.getInvoiceNumber() != null && b.getInvoiceNumber().toLowerCase().contains(needle)) {
          return true;
        }
        return b.getUserId().toString().toLowerCase().contains(needle);
      });
    }
    return stream.map(BookingResponse::from).toList();
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

  @PatchMapping("/{id}/reschedule")
  public BookingResponse reschedule(@PathVariable Long id, @Valid @RequestBody AdminRescheduleBookingRequest req) {
    UUID actor = SecurityUtils.currentUserId();
    return BookingResponse.from(
        bookingService.adminReschedule(id, actor, req.tanggalMain(), req.jamMulai(), req.durasiJam())
    );
  }

  @PatchMapping("/{id}/cancel")
  public BookingResponse cancel(@PathVariable Long id, @Valid @RequestBody AdminCancelBookingRequest req) {
    UUID actor = SecurityUtils.currentUserId();
    return BookingResponse.from(bookingService.adminCancel(id, actor, req.alasan()));
  }

  @PostMapping("/{id}/refund/request")
  public BookingResponse refundRequest(@PathVariable Long id, @Valid @RequestBody AdminRefundCreateRequest req) {
    UUID actor = SecurityUtils.currentUserId();
    return BookingResponse.from(bookingService.adminRequestRefund(id, actor, req.amount(), req.reason()));
  }

  @PatchMapping("/{id}/refund")
  public BookingResponse refundProcess(@PathVariable Long id, @Valid @RequestBody AdminRefundProcessRequest req) {
    UUID actor = SecurityUtils.currentUserId();
    if (req.approve()) {
      return BookingResponse.from(bookingService.adminProcessRefund(id, actor, true, req.processedAmount(), req.note()));
    }
    if (req.reject()) {
      return BookingResponse.from(bookingService.adminProcessRefund(id, actor, false, req.processedAmount(), req.note()));
    }
    throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Action harus APPROVE atau REJECT.");
  }

  @GetMapping("/{id}")
  public BookingResponse detail(@PathVariable Long id) {
    return bookingRepo.findByIdWithLapangan(id)
        .map(BookingResponse::from)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));
  }
}
