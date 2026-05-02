package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.web.dto.BookingResponse;
import jakarta.servlet.http.HttpServletResponse;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/export")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExportController {
  private final BookingRepository bookingRepo;

  public AdminExportController(BookingRepository bookingRepo) {
    this.bookingRepo = bookingRepo;
  }

  @GetMapping(value = "/booking.csv", produces = "text/csv")
  public void exportBookingCsv(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
      HttpServletResponse resp
  ) {
    var list = bookingRepo.findByTanggalMainBetweenWithLapangan(start, end).stream().map(BookingResponse::from).toList();
    resp.setHeader("Content-Disposition", "attachment; filename=\"booking-" + start + "-to-" + end + ".csv\"");
    try (PrintWriter w = resp.getWriter()) {
      w.println(String.join(",",
          "id",
          "userId",
          "lapanganId",
          "lapanganNama",
          "tanggalMain",
          "jamMulai",
          "jamSelesai",
          "status",
          "metodePembayaran",
          "totalHarga",
          "adminFee",
          "grandTotal",
          "paidAmount",
          "invoiceNumber",
          "invoiceIssuedAt",
          "createdAt"
      ));
      for (var b : list) {
        w.println(String.join(",",
            csv(b.id()),
            csv(b.userId()),
            csv(b.lapanganId()),
            csv(b.lapanganNama()),
            csv(b.tanggalMain()),
            csv(b.jamMulai()),
            csv(b.jamSelesai()),
            csv(b.status()),
            csv(b.metodePembayaran()),
            csv(b.totalHarga()),
            csv(b.adminFee()),
            csv(b.grandTotal()),
            csv(b.paidAmount()),
            csv(b.invoiceNumber()),
            csv(b.invoiceIssuedAt()),
            csv(b.createdAt())
        ));
      }
      w.flush();
    } catch (Exception ignored) {
      // client disconnected
    }
  }

  private static String csv(Object v) {
    if (v == null) return "";
    if (v instanceof BigDecimal) return ((BigDecimal) v).toPlainString();
    if (v instanceof Instant) return v.toString();
    String s = String.valueOf(v);
    boolean needQuote = s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r");
    if (!needQuote) return s;
    return "\"" + s.replace("\"", "\"\"") + "\"";
  }
}

