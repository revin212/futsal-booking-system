package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.domain.enums.BookingStatus;
import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.web.dto.InvoiceResponse;
import com.yourorg.futsal.web.exception.ApiException;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/invoice")
public class InvoiceController {
  private final BookingRepository bookingRepo;

  public InvoiceController(BookingRepository bookingRepo) {
    this.bookingRepo = bookingRepo;
  }

  @GetMapping("/{bookingId}")
  public InvoiceResponse get(@PathVariable Long bookingId, Authentication auth) {
    UUID userId = getUserId(auth);
    var b = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));

    if (!b.getUserId().equals(userId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Akses ditolak.");
    }
    if (b.getStatus() != BookingStatus.LUNAS && b.getStatus() != BookingStatus.SELESAI) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Invoice hanya tersedia untuk booking LUNAS/SELESAI.");
    }

    BigDecimal adminFee = b.getAdminFee() == null ? BigDecimal.ZERO : b.getAdminFee();
    BigDecimal totalHarga = b.getTotalHarga() == null ? BigDecimal.ZERO : b.getTotalHarga();
    BigDecimal grandTotal = totalHarga.add(adminFee);

    return new InvoiceResponse(
        b.getInvoiceNumber(),
        b.getInvoiceIssuedAt(),
        b.getId(),
        b.getLapangan().getNama(),
        b.getTanggalMain(),
        b.getJamMulai(),
        b.getJamSelesai(),
        totalHarga,
        adminFee,
        grandTotal,
        b.getStatus().name(),
        b.getVerifiedAt()
    );
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

