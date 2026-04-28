package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.entity.Booking;
import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.domain.repo.LapanganRepository;
import com.yourorg.futsal.web.dto.KalenderEventResponse;
import com.yourorg.futsal.web.exception.ApiException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class KalenderService {
  private static final DateTimeFormatter ISO_LOCAL = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

  private final LapanganRepository lapanganRepo;
  private final BookingRepository bookingRepo;

  public KalenderService(LapanganRepository lapanganRepo, BookingRepository bookingRepo) {
    this.lapanganRepo = lapanganRepo;
    this.bookingRepo = bookingRepo;
  }

  public List<KalenderEventResponse> getEvents(Long lapanganId, LocalDate start, LocalDate end) {
    var lapangan = lapanganRepo.findById(lapanganId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Lapangan tidak ditemukan."));
    if (!lapangan.isAktif()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Lapangan tidak aktif.");
    }

    List<Booking> bookings = bookingRepo.findByLapanganIdAndTanggalMainBetweenOrderByTanggalMainAscJamMulaiAsc(
        lapanganId, start, end
    );

    return bookings.stream().map(b -> {
      LocalDateTime s = LocalDateTime.of(b.getTanggalMain(), b.getJamMulai());
      LocalDateTime e = LocalDateTime.of(b.getTanggalMain(), b.getJamSelesai());

      // FullCalendar can accept ISO string without timezone; keep consistent.
      String startIso = s.format(ISO_LOCAL);
      String endIso = e.format(ISO_LOCAL);

      String color = switch (b.getStatus()) {
        case DIBATALKAN -> "#94a3b8";
        case LUNAS, DIBAYAR -> "#16a34a";
        case MENUNGGU_VERIFIKASI -> "#2563eb";
        case DITOLAK -> "#dc2626";
        case SELESAI -> "#0f172a";
        case DIBUAT, MENUNGGU_PEMBAYARAN -> "#f59e0b";
      };

      return KalenderEventResponse.fromBooking(b, startIso, endIso, color);
    }).toList();
  }
}

