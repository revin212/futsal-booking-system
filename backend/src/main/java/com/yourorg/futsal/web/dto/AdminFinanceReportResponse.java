package com.yourorg.futsal.web.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminFinanceReportResponse(
    BigDecimal totalRevenue,
    long totalBookings,
    double avgOccupancyPercent,
    List<RevenuePerLapangan> revenuePerLapangan,
    List<HeatCell> peakHourHeatmap,
    List<TopCustomer> topCustomers
) {
  public record RevenuePerLapangan(String lapanganNama, long bookings, BigDecimal revenue, long jamBooked) {}

  public record HeatCell(int dayOfWeek, int hour, int count) {}

  public record TopCustomer(String namaLengkap, String noWhatsapp, BigDecimal totalPaid) {}
}
