package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.web.dto.BookingResponse;
import com.yourorg.futsal.web.exception.ApiException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/refund")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRefundController {
  private final BookingRepository bookingRepo;

  public AdminRefundController(BookingRepository bookingRepo) {
    this.bookingRepo = bookingRepo;
  }

  @GetMapping
  public List<BookingResponse> list(@RequestParam String status) {
    String st = status.trim().toUpperCase();
    if (!"PENDING".equals(st) && !"REFUNDED".equals(st) && !"REJECTED".equals(st)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "status harus PENDING|REFUNDED|REJECTED.");
    }
    return bookingRepo.findByRefundStatusWithLapangan(st).stream().map(BookingResponse::from).toList();
  }
}
