package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.entity.JamOperasional;
import com.yourorg.futsal.domain.entity.Lapangan;
import com.yourorg.futsal.domain.enums.BookingStatus;
import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.domain.repo.JamOperasionalRepository;
import com.yourorg.futsal.domain.repo.LapanganRepository;
import com.yourorg.futsal.web.dto.SlotResponse;
import com.yourorg.futsal.web.exception.ApiException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class SlotService {
  private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");
  private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Jakarta");

  private final LapanganRepository lapanganRepo;
  private final JamOperasionalRepository jamRepo;
  private final BookingRepository bookingRepo;
  private final PricingService pricingService;

  public SlotService(
      LapanganRepository lapanganRepo,
      JamOperasionalRepository jamRepo,
      BookingRepository bookingRepo,
      PricingService pricingService
  ) {
    this.lapanganRepo = lapanganRepo;
    this.jamRepo = jamRepo;
    this.bookingRepo = bookingRepo;
    this.pricingService = pricingService;
  }

  public List<SlotResponse> getSlot(Long lapanganId, LocalDate tanggal) {
    Lapangan lapangan = lapanganRepo.findById(lapanganId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Lapangan tidak ditemukan."));

    if (!lapangan.isAktif()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Lapangan tidak aktif.");
    }

    JamOperasional jo = findJamOperasional(lapanganId, hariKe(tanggal));
    LocalTime jamBuka = jo.getJamBuka();
    LocalTime jamTutup = jo.getJamTutup();

    if (!jamBuka.isBefore(jamTutup)) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "Jam operasional tidak valid.");
    }

    // Phase 2 perf: load bookings once per tanggal (instead of per slot).
    var bookings = bookingRepo.findByLapanganIdAndTanggalMainNonCancelled(
        lapanganId, tanggal, BookingStatus.DIBATALKAN
    );

    List<SlotResponse> out = new ArrayList<>();
    LocalTime jamMulai = jamBuka;
    while (jamMulai.isBefore(jamTutup)) {
      LocalTime jamSelesai = jamMulai.plusHours(1);
      if (jamSelesai.isAfter(jamTutup)) break;

      final LocalTime slotMulai = jamMulai;
      final LocalTime slotSelesai = jamSelesai;
      boolean tersedia = bookings.stream().noneMatch(b ->
          b.getJamMulai().isBefore(slotSelesai) && b.getJamSelesai().isAfter(slotMulai)
      );

      out.add(new SlotResponse(
          HHMM.format(jamMulai),
          tersedia,
          pricingService.hargaPerJam(lapangan, tanggal, jamMulai)
      ));

      jamMulai = jamSelesai;
    }

    return out;
  }

  public List<SlotResponse> getSlotHariIni(Long lapanganId) {
    LocalDate today = LocalDate.now(DEFAULT_ZONE);
    return getSlot(lapanganId, today);
  }

  private JamOperasional findJamOperasional(Long lapanganId, int hariKe) {
    return jamRepo.findByLapanganIdAndIsAktifTrueOrderByHariKeAsc(lapanganId)
        .stream()
        .filter(j -> j.getHariKe() == hariKe)
        .findFirst()
        .orElseThrow(() -> new ApiException(
            HttpStatus.BAD_REQUEST,
            "Bad Request",
            "Jam operasional tidak ditemukan untuk hari ini."
        ));
  }

  private int hariKe(LocalDate tanggal) {
    // Postgres seed uses 0..6; we'll use 0=Sunday, 6=Saturday
    int dow = tanggal.getDayOfWeek().getValue(); // 1=Mon ... 7=Sun
    return dow % 7;
  }
}

