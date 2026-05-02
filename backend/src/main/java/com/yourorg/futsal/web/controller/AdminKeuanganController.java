package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.service.AdminFinanceService;
import com.yourorg.futsal.web.dto.AdminFinanceReportResponse;
import com.yourorg.futsal.web.dto.AdminFinanceSummaryRow;
import com.yourorg.futsal.web.dto.BookingResponse;
import java.time.LocalDate;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/keuangan")
@PreAuthorize("hasRole('ADMIN')")
public class AdminKeuanganController {
  private final AdminFinanceService financeService;

  public AdminKeuanganController(AdminFinanceService financeService) {
    this.financeService = financeService;
  }

  @GetMapping("/summary")
  public List<AdminFinanceSummaryRow> summary(
      @RequestParam LocalDate start,
      @RequestParam LocalDate end,
      @RequestParam(defaultValue = "DATE") String groupBy
  ) {
    LocalDate s = start;
    LocalDate e = end;
    if (s.isAfter(e)) {
      LocalDate t = s;
      s = e;
      e = t;
    }
    return financeService.summary(s, e, groupBy);
  }

  @GetMapping("/invoice")
  public List<BookingResponse> invoices(@RequestParam LocalDate start, @RequestParam LocalDate end) {
    LocalDate s = start;
    LocalDate e = end;
    if (s.isAfter(e)) {
      LocalDate t = s;
      s = e;
      e = t;
    }
    return financeService.invoices(s, e);
  }

  @GetMapping("/report")
  public AdminFinanceReportResponse report(@RequestParam LocalDate start, @RequestParam LocalDate end) {
    LocalDate s = start;
    LocalDate e = end;
    if (s.isAfter(e)) {
      LocalDate t = s;
      s = e;
      e = t;
    }
    return financeService.report(s, e);
  }
}
