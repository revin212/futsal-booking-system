package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.entity.AppUser;
import com.yourorg.futsal.domain.entity.Booking;
import com.yourorg.futsal.domain.enums.BookingStatus;
import com.yourorg.futsal.domain.repo.AppUserRepository;
import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.web.dto.AdminFinanceReportResponse;
import com.yourorg.futsal.web.dto.AdminFinanceSummaryRow;
import com.yourorg.futsal.web.dto.BookingResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class AdminFinanceService {
  private final BookingRepository bookingRepo;
  private final AppUserRepository userRepo;

  public AdminFinanceService(BookingRepository bookingRepo, AppUserRepository userRepo) {
    this.bookingRepo = bookingRepo;
    this.userRepo = userRepo;
  }

  public List<AdminFinanceSummaryRow> summary(LocalDate start, LocalDate end, String groupBy) {
    List<BookingStatus> st = List.of(BookingStatus.LUNAS, BookingStatus.SELESAI);
    List<Booking> rows = bookingRepo.findByTanggalMainBetweenAndStatusInWithLapangan(start, end, st);
    String gb = groupBy == null ? "DATE" : groupBy.trim().toUpperCase();
    Map<String, Agg> map = new HashMap<>();
    for (Booking b : rows) {
      String key = switch (gb) {
        case "METODE" -> b.getMetodePembayaran() == null ? "-" : b.getMetodePembayaran();
        case "LAPANGAN" -> String.valueOf(b.getLapangan().getId()) + "|" + b.getLapangan().getNama();
        default -> b.getTanggalMain().toString();
      };
      Agg a = map.computeIfAbsent(key, k -> new Agg());
      a.count++;
      a.totalHarga = a.totalHarga.add(nz(b.getTotalHarga()));
      a.adminFee = a.adminFee.add(nz(b.getAdminFee()));
      a.paidAmount = a.paidAmount.add(nz(b.getPaidAmount() != null ? b.getPaidAmount() : nz(b.getTotalHarga()).add(nz(b.getAdminFee()))));
    }
    List<AdminFinanceSummaryRow> out = new ArrayList<>();
    for (var e : map.entrySet()) {
      String label = e.getKey();
      if ("LAPANGAN".equals(gb) && label.contains("|")) {
        label = label.substring(label.indexOf('|') + 1);
      }
      Agg a = e.getValue();
      out.add(new AdminFinanceSummaryRow(label, a.count, a.totalHarga, a.adminFee, a.paidAmount));
    }
    out.sort(Comparator.comparing(AdminFinanceSummaryRow::key));
    return out;
  }

  public List<BookingResponse> invoices(LocalDate start, LocalDate end) {
    return bookingRepo.findByTanggalMainBetweenWithLapangan(start, end).stream()
        .filter(b -> b.getInvoiceNumber() != null && !b.getInvoiceNumber().isBlank())
        .filter(b -> b.getStatus() == BookingStatus.LUNAS || b.getStatus() == BookingStatus.SELESAI)
        .map(BookingResponse::from)
        .toList();
  }

  public AdminFinanceReportResponse report(LocalDate start, LocalDate end) {
    List<BookingStatus> st = List.of(BookingStatus.LUNAS, BookingStatus.SELESAI);
    List<Booking> paid = bookingRepo.findByTanggalMainBetweenAndStatusInWithLapangan(start, end, st);

    Map<Long, LapAgg> perLap = new HashMap<>();
    Map<String, Integer> heat = new TreeMap<>();
    Map<UUID, BigDecimal> userTotals = new HashMap<>();

    BigDecimal totalRev = BigDecimal.ZERO;
    long totalBookings = paid.size();
    long totalJam = 0;

    for (Booking b : paid) {
      BigDecimal paidAmt = b.getPaidAmount() != null ? b.getPaidAmount() : nz(b.getTotalHarga()).add(nz(b.getAdminFee()));
      totalRev = totalRev.add(paidAmt);
      long lid = b.getLapangan().getId();
      LapAgg la = perLap.computeIfAbsent(lid, x -> new LapAgg(b.getLapangan().getNama()));
      la.bookings++;
      la.revenue = la.revenue.add(paidAmt);
      long dur = Duration.between(b.getJamMulai(), b.getJamSelesai()).toHours();
      if (dur < 1) dur = 1;
      la.jamBooked += dur;
      totalJam += dur;

      int dow = b.getTanggalMain().getDayOfWeek().getValue() % 7;
      int hour = b.getJamMulai().getHour();
      String hk = dow + "x" + hour;
      heat.merge(hk, 1, Integer::sum);

      userTotals.merge(b.getUserId(), paidAmt, BigDecimal::add);
    }

    List<AdminFinanceReportResponse.RevenuePerLapangan> revRows = perLap.entrySet().stream()
        .map(e -> new AdminFinanceReportResponse.RevenuePerLapangan(e.getValue().nama, e.getValue().bookings, e.getValue().revenue, e.getValue().jamBooked))
        .sorted(Comparator.comparing(AdminFinanceReportResponse.RevenuePerLapangan::revenue).reversed())
        .toList();

    List<AdminFinanceReportResponse.HeatCell> heatmap = heat.entrySet().stream()
        .map(en -> {
          String[] p = en.getKey().split("x");
          return new AdminFinanceReportResponse.HeatCell(Integer.parseInt(p[0]), Integer.parseInt(p[1]), en.getValue());
        })
        .sorted(Comparator.comparing(AdminFinanceReportResponse.HeatCell::dayOfWeek).thenComparing(AdminFinanceReportResponse.HeatCell::hour))
        .toList();

    List<Map.Entry<UUID, BigDecimal>> topEntries = userTotals.entrySet().stream()
        .sorted(Comparator.comparing((Map.Entry<UUID, BigDecimal> e) -> e.getValue()).reversed())
        .limit(10)
        .toList();
    List<UUID> topIds = topEntries.stream().map(Map.Entry::getKey).toList();
    Map<UUID, AppUser> usersById =
        userRepo.findAllById(topIds).stream().collect(Collectors.toMap(AppUser::getId, u -> u));
    List<AdminFinanceReportResponse.TopCustomer> top = topEntries.stream()
        .map(e -> {
          AppUser u = usersById.get(e.getKey());
          String nama = u != null ? u.getNamaLengkap() : "—";
          String wa = u != null && u.getNoHp() != null && !u.getNoHp().isBlank() ? u.getNoHp() : "—";
          return new AdminFinanceReportResponse.TopCustomer(nama, wa, e.getValue());
        })
        .toList();

    long days = Duration.between(start.atStartOfDay(), end.plusDays(1).atStartOfDay()).toDays();
    if (days < 1) days = 1;
    int lapCount = perLap.isEmpty() ? 1 : perLap.size();
    long denomSlots = days * lapCount * 16;
    double avgOcc = denomSlots > 0 ? (double) totalJam / (double) denomSlots * 100.0 : 0.0;

    return new AdminFinanceReportResponse(
        totalRev,
        totalBookings,
        BigDecimal.valueOf(avgOcc).setScale(1, RoundingMode.HALF_UP).doubleValue(),
        revRows,
        heatmap,
        top
    );
  }

  private static BigDecimal nz(BigDecimal v) {
    return v == null ? BigDecimal.ZERO : v;
  }

  private static final class Agg {
    int count;
    BigDecimal totalHarga = BigDecimal.ZERO;
    BigDecimal adminFee = BigDecimal.ZERO;
    BigDecimal paidAmount = BigDecimal.ZERO;
  }

  private static final class LapAgg {
    final String nama;
    long bookings;
    BigDecimal revenue = BigDecimal.ZERO;
    long jamBooked;

    LapAgg(String nama) {
      this.nama = nama;
    }
  }
}
