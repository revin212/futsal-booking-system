package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.entity.Booking;
import com.yourorg.futsal.domain.entity.JamOperasional;
import com.yourorg.futsal.domain.enums.BookingStatus;
import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.domain.repo.JamOperasionalRepository;
import com.yourorg.futsal.domain.repo.LapanganRepository;
import com.yourorg.futsal.domain.repo.PengaturanSistemRepository;
import com.yourorg.futsal.web.exception.ApiException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class BookingService {
  private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Jakarta");
  private static final long MAX_UPLOAD_BYTES = 10L * 1024 * 1024; // 10 MB

  private final LapanganRepository lapanganRepo;
  private final JamOperasionalRepository jamRepo;
  private final BookingRepository bookingRepo;
  private final PengaturanSistemRepository settingsRepo;
  private final PricingService pricingService;

  public BookingService(
      LapanganRepository lapanganRepo,
      JamOperasionalRepository jamRepo,
      BookingRepository bookingRepo,
      PengaturanSistemRepository settingsRepo,
      PricingService pricingService
  ) {
    this.lapanganRepo = lapanganRepo;
    this.jamRepo = jamRepo;
    this.bookingRepo = bookingRepo;
    this.settingsRepo = settingsRepo;
    this.pricingService = pricingService;
  }

  public Booking createBooking(UUID userId, Long lapanganId, LocalDate tanggalMain, LocalTime jamMulai, int durasiJam) {
    var lapangan = lapanganRepo.findById(lapanganId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Lapangan tidak ditemukan."));

    if (!lapangan.isAktif()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Lapangan tidak aktif.");
    }

    if (durasiJam < 1) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Durasi minimal 1 jam.");
    }

    if (jamMulai.getMinute() != 0 || jamMulai.getSecond() != 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Jam mulai harus tepat per 1 jam (menit = 00).");
    }

    LocalTime jamSelesai = jamMulai.plusHours(durasiJam);
    if (!jamMulai.isBefore(jamSelesai)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Jam tidak valid.");
    }

    JamOperasional jo = findJamOperasional(lapanganId, hariKe(tanggalMain));
    if (jamMulai.isBefore(jo.getJamBuka()) || jamSelesai.isAfter(jo.getJamTutup())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Booking di luar jam operasional.");
    }

    // Conflict check: any overlap with non-cancelled booking blocks immediately.
    List<Booking> existing = bookingRepo.findByLapanganIdAndTanggalMainNonCancelled(
        lapanganId, tanggalMain, BookingStatus.DIBATALKAN
    );
    boolean conflict = existing.stream().anyMatch(b ->
        b.getJamMulai().isBefore(jamSelesai) && b.getJamSelesai().isAfter(jamMulai)
    );
    if (conflict) {
      throw new ApiException(HttpStatus.CONFLICT, "Conflict", "Slot sudah dibooking.");
    }

    BigDecimal total = BigDecimal.ZERO;
    LocalTime t = jamMulai;
    for (int i = 0; i < durasiJam; i++) {
      total = total.add(pricingService.hargaPerJam(lapangan, tanggalMain, t));
      t = t.plusHours(1);
    }

    Booking b = new Booking();
    b.setUserId(userId);
    b.setLapangan(lapangan);
    b.setTanggalMain(tanggalMain);
    b.setJamMulai(jamMulai);
    b.setJamSelesai(jamSelesai);
    b.setStatus(BookingStatus.MENUNGGU_PEMBAYARAN);
    b.setTotalHarga(total);
    return bookingRepo.save(b);
  }

  public List<Booking> listByUser(UUID userId) {
    return bookingRepo.findByUserIdWithLapanganOrderByCreatedAtDesc(userId);
  }

  public Booking getBookingDetailForUser(UUID userId, Long bookingId) {
    Booking booking = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));
    if (!booking.getUserId().equals(userId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Akses ditolak.");
    }
    return booking;
  }

  public Booking uploadBuktiBayar(UUID userId, Long bookingId, MultipartFile file) {
    Booking booking = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));

    if (!booking.getUserId().equals(userId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Akses ditolak.");
    }

    if (booking.getStatus() == BookingStatus.DIBATALKAN) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Booking sudah dibatalkan.");
    }

    if (file == null || file.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "File bukti bayar wajib diupload.");
    }
    if (file.getSize() > MAX_UPLOAD_BYTES) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Ukuran file terlalu besar (maks 10MB).");
    }

    String original = file.getOriginalFilename();
    String ext = "";
    if (original != null) {
      int dot = original.lastIndexOf('.');
      if (dot >= 0 && dot + 1 < original.length()) {
        ext = original.substring(dot).replaceAll("[^a-zA-Z0-9.]", "");
      }
    }

    String safeExt = ext.length() > 10 ? "" : ext;
    String filename = "bukti-" + UUID.randomUUID() + safeExt;

    Path uploadDir = Paths.get("storage", "uploads", "booking-" + booking.getId());
    try {
      Files.createDirectories(uploadDir);
      Path dest = uploadDir.resolve(filename).normalize();
      if (!dest.startsWith(uploadDir.normalize())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Nama file tidak valid.");
      }
      try (InputStream in = file.getInputStream()) {
        Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
      }
      String relative = Paths.get("uploads", "booking-" + booking.getId(), filename).toString().replace("\\", "/");
      booking.setBuktiBayarPath(relative);
      return bookingRepo.save(booking);
    } catch (ApiException e) {
      throw e;
    } catch (Exception e) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "Gagal menyimpan bukti bayar.");
    }
  }

  public Booking konfirmasiBayar(UUID userId, Long bookingId) {
    Booking booking = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));

    if (!booking.getUserId().equals(userId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Akses ditolak.");
    }

    if (booking.getStatus() == BookingStatus.DIBATALKAN) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Booking sudah dibatalkan.");
    }

    if (booking.getBuktiBayarPath() == null || booking.getBuktiBayarPath().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Upload bukti bayar terlebih dahulu.");
    }

    booking.setStatus(BookingStatus.MENUNGGU_VERIFIKASI);
    return bookingRepo.save(booking);
  }

  public Booking adminVerifikasi(Long bookingId, boolean approve) {
    Booking booking = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));

    if (booking.getStatus() != BookingStatus.MENUNGGU_VERIFIKASI) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Booking tidak dalam status menunggu verifikasi.");
    }

    if (approve) {
      booking.setStatus(BookingStatus.LUNAS);
      booking.setVerifiedAt(Instant.now());
    } else {
      booking.setStatus(BookingStatus.DITOLAK);
      booking.setVerifiedAt(Instant.now());
    }
    return bookingRepo.save(booking);
  }

  public Booking cancelBooking(UUID userId, Long bookingId) {
    Booking booking = bookingRepo.findById(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));

    if (!booking.getUserId().equals(userId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Akses ditolak.");
    }

    if (booking.getStatus() == BookingStatus.DIBATALKAN) {
      return booking;
    }

    int minJam = getMinJamBatalkan();
    LocalDateTime now = LocalDateTime.now(DEFAULT_ZONE);
    LocalDateTime waktuMain = LocalDateTime.of(booking.getTanggalMain(), booking.getJamMulai());
    long diffMinutes = Duration.between(now, waktuMain).toMinutes();

    if (diffMinutes < (long) minJam * 60) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "Bad Request",
          "Booking tidak bisa dibatalkan (melebihi batas waktu pembatalan)."
      );
    }

    booking.setStatus(BookingStatus.DIBATALKAN);
    return bookingRepo.save(booking);
  }

  private int getMinJamBatalkan() {
    return settingsRepo.findByKey("MinJamBatalkan")
        .map(s -> {
          try {
            return Integer.parseInt(s.getValue());
          } catch (NumberFormatException e) {
            return 2;
          }
        })
        .orElse(2);
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
    int dow = tanggal.getDayOfWeek().getValue(); // 1=Mon ... 7=Sun
    return dow % 7;
  }
}

