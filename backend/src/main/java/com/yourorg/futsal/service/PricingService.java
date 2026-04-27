package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.entity.Lapangan;
import com.yourorg.futsal.domain.repo.PengaturanSistemRepository;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import org.springframework.stereotype.Service;

@Service
public class PricingService {
  private final PengaturanSistemRepository settings;

  public PricingService(PengaturanSistemRepository settings) {
    this.settings = settings;
  }

  public BigDecimal hargaPerJam(Lapangan lapangan, LocalDate tanggal, LocalTime jam) {
    if (isWeekend(tanggal)) {
      return lapangan.getHargaWeekend();
    }

    LocalTime peakStart = getSettingTime("PeakHourMulai");
    LocalTime peakEnd = getSettingTime("PeakHourSelesai");
    if (peakStart != null && peakEnd != null && isInRangeExclusiveEnd(jam, peakStart, peakEnd)) {
      return lapangan.getHargaPeakHour();
    }

    return lapangan.getHargaRegular();
  }

  private boolean isWeekend(LocalDate tanggal) {
    DayOfWeek dow = tanggal.getDayOfWeek();
    return dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY;
  }

  private boolean isInRangeExclusiveEnd(LocalTime t, LocalTime start, LocalTime end) {
    return (t.equals(start) || t.isAfter(start)) && t.isBefore(end);
  }

  private LocalTime getSettingTime(String key) {
    return settings.findByKey(key)
        .map(s -> {
          try {
            return LocalTime.parse(s.getValue());
          } catch (DateTimeParseException e) {
            return null;
          }
        })
        .orElse(null);
  }
}

