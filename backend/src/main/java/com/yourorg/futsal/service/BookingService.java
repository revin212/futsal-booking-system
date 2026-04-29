package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.entity.Booking;
import com.yourorg.futsal.domain.entity.JamOperasional;
import com.yourorg.futsal.domain.entity.AppUser;
import com.yourorg.futsal.domain.enums.BookingStatus;
import com.yourorg.futsal.domain.enums.UserRole;
import com.yourorg.futsal.domain.repo.AppUserRepository;
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
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class BookingService {
  private static final Logger log = LoggerFactory.getLogger(BookingService.class);
  private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Jakarta");
  private static final DateTimeFormatter INVOICE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");
  private static final long MAX_UPLOAD_BYTES = 10L * 1024 * 1024; // 10 MB
  private static final long PAYMENT_HOLD_MINUTES = 10;

  private final LapanganRepository lapanganRepo;
  private final JamOperasionalRepository jamRepo;
  private final BookingRepository bookingRepo;
  private final AppUserRepository userRepo;
  private final PengaturanSistemRepository settingsRepo;
  private final PricingService pricingService;
  private final WhatsappNotificationService waService;
  private final AuditLogService auditLogService;

  public BookingService(
      LapanganRepository lapanganRepo,
      JamOperasionalRepository jamRepo,
      BookingRepository bookingRepo,
      AppUserRepository userRepo,
      PengaturanSistemRepository settingsRepo,
      PricingService pricingService,
      WhatsappNotificationService waService,
      AuditLogService auditLogService
  ) {
    this.lapanganRepo = lapanganRepo;
    this.jamRepo = jamRepo;
    this.bookingRepo = bookingRepo;
    this.userRepo = userRepo;
    this.settingsRepo = settingsRepo;
    this.pricingService = pricingService;
    this.waService = waService;
    this.auditLogService = auditLogService;
  }

  public Booking createBooking(
      UUID userId,
      Long lapanganId,
      LocalDate tanggalMain,
      LocalTime jamMulai,
      int durasiJam,
      String metodePembayaranRaw,
      String noHpRaw
  ) {
    AppUser u = userRepo.findById(userId)
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "User tidak ditemukan."));
    String normalizedNoHp = normalizeNoHp(noHpRaw);
    if (normalizedNoHp == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Nomor WhatsApp tidak valid.");
    }
    if (u.getNoHp() == null || u.getNoHp().isBlank() || !u.getNoHp().trim().equals(normalizedNoHp)) {
      u.setNoHp(normalizedNoHp);
      userRepo.save(u);
    }

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
    Instant cutoff = Instant.now().minus(PAYMENT_HOLD_MINUTES, ChronoUnit.MINUTES);
    List<Booking> existing = bookingRepo.findByLapanganIdAndTanggalMainNonCancelledNonExpiredPending(
        lapanganId, tanggalMain, BookingStatus.DIBATALKAN, BookingStatus.MENUNGGU_PEMBAYARAN, cutoff
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

    String metodePembayaran = metodePembayaranRaw == null ? "" : metodePembayaranRaw.trim().toUpperCase();
    if (!metodePembayaran.equals("QRIS")
        && !metodePembayaran.equals("TRANSFER")
        && !metodePembayaran.equals("EMONEY")
        && !metodePembayaran.equals("CASH")) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Metode pembayaran tidak valid.");
    }

    boolean actorIsAdmin = u.getRole() == UserRole.ADMIN;

    BigDecimal adminFee = switch (metodePembayaran) {
      case "QRIS" -> BigDecimal.valueOf(1500);
      case "TRANSFER" -> BigDecimal.valueOf(2500);
      case "EMONEY" -> BigDecimal.valueOf(2000);
      default -> BigDecimal.ZERO; // CASH
    };

    Booking b = new Booking();
    b.setUserId(userId);
    b.setLapangan(lapangan);
    b.setTanggalMain(tanggalMain);
    b.setJamMulai(jamMulai);
    b.setJamSelesai(jamSelesai);
    b.setTotalHarga(total);
    b.setMetodePembayaran(metodePembayaran);
    b.setAdminFee(adminFee);

    // CASH flow:
    // - ADMIN: booking langsung LUNAS (tanpa payment gateway).
    // - USER: booking MENUNGGU_VERIFIKASI (admin verifikasi di halaman admin).
    if ("CASH".equals(metodePembayaran)) {
      BigDecimal grandTotal = total.add(adminFee);
      b.setPaidAmount(grandTotal);
      if (actorIsAdmin) {
        b.setStatus(BookingStatus.LUNAS);
        b.setVerifiedAt(Instant.now());
      } else {
        b.setStatus(BookingStatus.MENUNGGU_VERIFIKASI);
      }
    } else {
      b.setStatus(BookingStatus.MENUNGGU_PEMBAYARAN);
    }

    Booking saved = bookingRepo.save(b);
    // Invoice number needs booking id; generate after first save.
    if (saved.getStatus() == BookingStatus.LUNAS || saved.getStatus() == BookingStatus.SELESAI) {
      ensureInvoice(saved);
      saved = bookingRepo.save(saved);
    }
    try {
      waService.notifyBookingCreated(saved);
    } catch (Exception e) {
      log.warn("Failed to send WA mock for booking created id={}", saved.getId(), e);
    }
    return saved;
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

  public Booking mockPay(UUID userId, Long bookingId) {
    Booking booking = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));

    if (!booking.getUserId().equals(userId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Akses ditolak.");
    }
    if (booking.getStatus() == BookingStatus.DIBATALKAN) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Booking sudah dibatalkan.");
    }
    if (booking.getStatus() == BookingStatus.LUNAS) {
      return booking;
    }
    boolean willBecomeLunas = false;
    if (booking.getStatus() == BookingStatus.MENUNGGU_VERIFIKASI) {
      // legacy/manual flow; mock payment finalizes immediately.
      booking.setStatus(BookingStatus.LUNAS);
      if (booking.getVerifiedAt() == null) booking.setVerifiedAt(Instant.now());
      ensureInvoice(booking);
      willBecomeLunas = true;
      Booking saved = bookingRepo.save(booking);
      if (willBecomeLunas) {
        try {
          waService.notifyPaymentSuccess(saved);
        } catch (Exception e) {
          log.warn("Failed to send WA mock for payment success id={}", saved.getId(), e);
        }
      }
      return saved;
    }

    if (booking.getMetodePembayaran() == null || booking.getMetodePembayaran().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Metode pembayaran belum dipilih.");
    }

    BigDecimal adminFee = booking.getAdminFee() == null ? BigDecimal.ZERO : booking.getAdminFee();
    BigDecimal totalHarga = booking.getTotalHarga() == null ? BigDecimal.ZERO : booking.getTotalHarga();
    booking.setPaidAmount(totalHarga.add(adminFee));
    booking.setStatus(BookingStatus.LUNAS);
    booking.setVerifiedAt(Instant.now());
    ensureInvoice(booking);
    willBecomeLunas = true;
    Booking saved = bookingRepo.save(booking);
    if (willBecomeLunas) {
      try {
        waService.notifyPaymentSuccess(saved);
      } catch (Exception e) {
        log.warn("Failed to send WA mock for payment success id={}", saved.getId(), e);
      }
    }
    return saved;
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
      // Hardening: pastikan paidAmount tersedia untuk refund.
      if (booking.getPaidAmount() == null) {
        BigDecimal adminFee = booking.getAdminFee() == null ? BigDecimal.ZERO : booking.getAdminFee();
        BigDecimal totalHarga = booking.getTotalHarga() == null ? BigDecimal.ZERO : booking.getTotalHarga();
        booking.setPaidAmount(totalHarga.add(adminFee));
      }
      ensureInvoice(booking);
    } else {
      booking.setStatus(BookingStatus.DITOLAK);
      booking.setVerifiedAt(Instant.now());
    }
    return bookingRepo.save(booking);
  }

  private void ensureInvoice(Booking booking) {
    if (booking.getInvoiceNumber() != null && !booking.getInvoiceNumber().isBlank()) return;
    String date = ZonedDateTime.now(DEFAULT_ZONE).format(INVOICE_DATE);
    String inv = "INV-" + date + "-" + booking.getId();
    booking.setInvoiceNumber(inv);
    if (booking.getInvoiceIssuedAt() == null) booking.setInvoiceIssuedAt(Instant.now());
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
    if (booking.getStatus() == BookingStatus.LUNAS) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "Bad Request",
          "Booking sudah lunas. Gunakan fitur refund untuk pembatalan."
      );
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

  public Booking requestRefund(UUID userId, Long bookingId, String reason) {
    Booking booking = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));
    if (!booking.getUserId().equals(userId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Akses ditolak.");
    }
    if (booking.getStatus() != BookingStatus.LUNAS) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Refund hanya untuk booking status LUNAS.");
    }
    String rs = booking.getRefundStatus() == null ? "NONE" : booking.getRefundStatus().trim().toUpperCase();
    if ("PENDING".equals(rs)) {
      // idempotent: refund request hanya sekali selama masih PENDING
      return booking;
    }
    if (!"NONE".equals(rs) && !"REJECTED".equals(rs)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Refund sudah diproses.");
    }

    int minJam = getMinJamBatalkan();
    LocalDateTime now = LocalDateTime.now(DEFAULT_ZONE);
    LocalDateTime waktuMain = LocalDateTime.of(booking.getTanggalMain(), booking.getJamMulai());
    long diffMinutes = Duration.between(now, waktuMain).toMinutes();
    if (diffMinutes < (long) minJam * 60) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "Bad Request",
          "Refund tidak bisa diajukan (melebihi batas waktu pembatalan)."
      );
    }

    booking.setStatus(BookingStatus.DIBATALKAN); // release slot for rebooking
    booking.setRefundStatus("PENDING");
    booking.setRefundRequestedAt(Instant.now());
    booking.setRefundReason(reason == null ? null : reason.trim());
    booking.setRefundAmount(booking.getPaidAmount());
    Booking saved = bookingRepo.save(booking);
    auditLogService.log(
        userId,
        "USER",
        "REFUND_REQUESTED",
        "BOOKING",
        String.valueOf(saved.getId()),
        json("""
            {"reason":"%s","refundAmount":%s,"refundStatus":"%s","bookingStatus":"%s"}
            """.trim(),
            saved.getRefundReason(),
            saved.getRefundAmount(),
            saved.getRefundStatus(),
            saved.getStatus().name()
        )
    );
    return saved;
  }

  public Booking adminProcessRefund(Long bookingId, boolean approve, String note) {
    Booking booking = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));
    if (!"PENDING".equalsIgnoreCase(booking.getRefundStatus())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Refund tidak dalam status PENDING.");
    }
    booking.setRefundProcessedAt(Instant.now());
    if (approve) {
      booking.setRefundStatus("REFUNDED");
    } else {
      booking.setRefundStatus("REJECTED");
    }
    Booking saved = bookingRepo.save(booking);
    auditLogService.log(
        null,
        "ADMIN",
        approve ? "REFUND_APPROVED" : "REFUND_REJECTED",
        "BOOKING",
        String.valueOf(saved.getId()),
        json("""
            {"note":"%s","refundAmount":%s,"refundStatus":"%s","bookingStatus":"%s"}
            """.trim(),
            note,
            saved.getRefundAmount(),
            saved.getRefundStatus(),
            saved.getStatus().name()
        )
    );
    return saved;
  }

  private static String json(String template, Object... args) {
    Object[] safe = new Object[args.length];
    for (int i = 0; i < args.length; i++) {
      safe[i] = jsonValue(args[i]);
    }
    return String.format(template, safe);
  }

  private static String jsonValue(Object v) {
    if (v == null) return "";
    if (v instanceof BigDecimal) return v.toString();
    String s = String.valueOf(v);
    return jsonEscape(s);
  }

  private static String jsonEscape(String s) {
    StringBuilder out = new StringBuilder(s.length() + 16);
    for (int i = 0; i < s.length(); i++) {
      char c = s.charAt(i);
      switch (c) {
        case '\\' -> out.append("\\\\");
        case '"' -> out.append("\\\"");
        case '\n' -> out.append("\\n");
        case '\r' -> out.append("\\r");
        case '\t' -> out.append("\\t");
        default -> out.append(c);
      }
    }
    return out.toString();
  }

  private static String normalizeNoHp(String raw) {
    if (raw == null) return null;
    String s = raw.trim().replaceAll("[\\s-]", "");
    if (s.isBlank()) return null;
    if (s.startsWith("+62")) return s;
    if (s.startsWith("62")) return "+" + s;
    if (s.startsWith("0")) return "+62" + s.substring(1);
    return null;
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

