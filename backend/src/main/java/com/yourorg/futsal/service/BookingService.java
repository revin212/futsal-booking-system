package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.entity.Booking;
import com.yourorg.futsal.domain.entity.JamOperasional;
import com.yourorg.futsal.domain.entity.MetodePembayaran;
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
  private final MetodePembayaranService metodePembayaranService;
  private final WhatsappNotificationService waService;
  private final AuditLogService auditLogService;

  public BookingService(
      LapanganRepository lapanganRepo,
      JamOperasionalRepository jamRepo,
      BookingRepository bookingRepo,
      AppUserRepository userRepo,
      PengaturanSistemRepository settingsRepo,
      PricingService pricingService,
      MetodePembayaranService metodePembayaranService,
      WhatsappNotificationService waService,
      AuditLogService auditLogService
  ) {
    this.lapanganRepo = lapanganRepo;
    this.jamRepo = jamRepo;
    this.bookingRepo = bookingRepo;
    this.userRepo = userRepo;
    this.settingsRepo = settingsRepo;
    this.pricingService = pricingService;
    this.metodePembayaranService = metodePembayaranService;
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
    boolean actorIsAdmin = u.getRole() == UserRole.ADMIN;

    String normalizedNoHp = normalizeNoHp(noHpRaw);
    if (!actorIsAdmin && normalizedNoHp == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Nomor WhatsApp wajib diisi.");
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

    MetodePembayaran metode = metodePembayaranService.requireActiveForBooking(metodePembayaranRaw);
    BigDecimal adminFee = metode.getAdminFee() != null ? metode.getAdminFee() : BigDecimal.ZERO;
    String metodePembayaran = metode.getKode();

    Booking b = new Booking();
    b.setUserId(userId);
    b.setLapangan(lapangan);
    b.setTanggalMain(tanggalMain);
    b.setJamMulai(jamMulai);
    b.setJamSelesai(jamSelesai);
    b.setTotalHarga(total);
    b.setMetodePembayaran(metodePembayaran);
    b.setAdminFee(adminFee);

    // Tanpa payment gateway (mis. tunai):
    // - ADMIN: booking langsung LUNAS.
    // - USER: booking MENUNGGU_VERIFIKASI (admin verifikasi di halaman admin).
    if (metode.isTanpaPaymentGateway()) {
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

    // persist WA number to booking only
    if (actorIsAdmin) {
      // ADMIN: nomor opsional, dan tidak mengubah app_user.no_hp
      b.setNoHp(normalizedNoHp != null ? normalizedNoHp : normalizeNoHp(u.getNoHp()));
    } else {
      // USER: wajib diisi, dan disimpan ke profile + booking agar ter-prefill
      u.setNoHp(normalizedNoHp);
      userRepo.save(u);
      b.setNoHp(normalizedNoHp);
    }

    Booking saved = bookingRepo.save(b);
    // Invoice number needs booking id; generate after first save.
    if (saved.getStatus() == BookingStatus.LUNAS || saved.getStatus() == BookingStatus.SELESAI) {
      ensureInvoice(saved);
      saved = bookingRepo.save(saved);
    }
    Long bookingId = saved.getId();
    try {
      waService.notifyBookingCreated(saved);
    } catch (Exception e) {
      log.warn("Failed to send WA mock for booking created id={}", saved.getId(), e);
    }
    // Hardening: make sure lapangan is join-fetched before controller serializes BookingResponse.
    return reloadWithLapangan(bookingId);
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
      Booking saved = bookingRepo.save(booking);
      // Hardening: avoid LazyInitialization on b.lapangan during response mapping.
      return reloadWithLapangan(saved.getId());
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
    Booking saved = bookingRepo.save(booking);
    return reloadWithLapangan(saved.getId());
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
      return reloadWithLapangan(booking.getId());
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
      return reloadWithLapangan(saved.getId());
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
    return reloadWithLapangan(saved.getId());
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
      // Hardening: pastikan paidAmount tersedia untuk invoice/rekonsiliasi.
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
    Booking saved = bookingRepo.save(booking);
    return reloadWithLapangan(saved.getId());
  }

  public Booking adminReschedule(Long bookingId, java.util.UUID actorUserId, LocalDate tanggalBaru, LocalTime jamMulaiBaru, int durasiJam) {
    Booking booking = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));
    BookingStatus st = booking.getStatus();
    if (st != BookingStatus.LUNAS && st != BookingStatus.MENUNGGU_VERIFIKASI && st != BookingStatus.MENUNGGU_PEMBAYARAN) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Booking tidak bisa di-reschedule pada status ini.");
    }
    if (durasiJam < 1) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Durasi minimal 1 jam.");
    }
    if (jamMulaiBaru.getMinute() != 0 || jamMulaiBaru.getSecond() != 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Jam mulai harus tepat per 1 jam (menit = 00).");
    }
    Long lapanganId = booking.getLapangan().getId();
    LocalTime jamSelesaiBaru = jamMulaiBaru.plusHours(durasiJam);
    if (!jamMulaiBaru.isBefore(jamSelesaiBaru)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Jam tidak valid.");
    }

    JamOperasional jo = findJamOperasional(lapanganId, hariKe(tanggalBaru));
    if (jamMulaiBaru.isBefore(jo.getJamBuka()) || jamSelesaiBaru.isAfter(jo.getJamTutup())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Booking di luar jam operasional.");
    }

    Instant cutoff = Instant.now().minus(PAYMENT_HOLD_MINUTES, ChronoUnit.MINUTES);
    List<Booking> overlapping = bookingRepo.findOverlappingNonCancelledNonExpiredPending(
        lapanganId,
        tanggalBaru,
        jamMulaiBaru,
        jamSelesaiBaru,
        BookingStatus.DIBATALKAN,
        BookingStatus.MENUNGGU_PEMBAYARAN,
        cutoff
    );
    boolean conflict = overlapping.stream().anyMatch(o -> !o.getId().equals(bookingId));
    if (conflict) {
      throw new ApiException(HttpStatus.CONFLICT, "Conflict", "Slot sudah dibooking.");
    }

    BigDecimal total = BigDecimal.ZERO;
    LocalTime t = jamMulaiBaru;
    for (int i = 0; i < durasiJam; i++) {
      total = total.add(pricingService.hargaPerJam(booking.getLapangan(), tanggalBaru, t));
      t = t.plusHours(1);
    }

    booking.setTanggalMain(tanggalBaru);
    booking.setJamMulai(jamMulaiBaru);
    booking.setJamSelesai(jamSelesaiBaru);
    booking.setTotalHarga(total);

    BigDecimal adminFee = booking.getAdminFee() == null ? BigDecimal.ZERO : booking.getAdminFee();
    BigDecimal grandTotal = total.add(adminFee);
    if (st == BookingStatus.LUNAS || st == BookingStatus.MENUNGGU_VERIFIKASI) {
      booking.setPaidAmount(grandTotal);
    }

    Booking saved = bookingRepo.save(booking);
    try {
      auditLogService.log(
          actorUserId,
          "ADMIN",
          "BOOKING_RESCHEDULE",
          "Booking",
          String.valueOf(bookingId),
          json("{\"tanggal\":\"%s\",\"jamMulai\":\"%s\",\"jamSelesai\":\"%s\"}", tanggalBaru, jamMulaiBaru, jamSelesaiBaru)
      );
    } catch (Exception ignored) {
      log.warn("audit reschedule failed id={}", bookingId);
    }
    return reloadWithLapangan(saved.getId());
  }

  public Booking adminCancel(Long bookingId, java.util.UUID actorUserId, String alasan) {
    Booking booking = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));
    if (booking.getStatus() == BookingStatus.DIBATALKAN) {
      return reloadWithLapangan(bookingId);
    }
    if (booking.getStatus() == BookingStatus.SELESAI) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Booking selesai tidak bisa dibatalkan.");
    }
    booking.setStatus(BookingStatus.DIBATALKAN);
    bookingRepo.save(booking);
    try {
      auditLogService.log(
          actorUserId,
          "ADMIN",
          "BOOKING_CANCEL_ADMIN",
          "Booking",
          String.valueOf(bookingId),
          json("{\"alasan\":\"%s\"}", alasan == null ? "" : alasan)
      );
    } catch (Exception ignored) {
      log.warn("audit cancel failed id={}", bookingId);
    }
    return reloadWithLapangan(bookingId);
  }

  public Booking adminRequestRefund(Long bookingId, java.util.UUID actorUserId, BigDecimal amount, String reason) {
    Booking booking = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));
    if (!"NONE".equals(booking.getRefundStatus()) && !"REJECTED".equals(booking.getRefundStatus())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Refund sudah diajukan atau diproses.");
    }
    if (booking.getStatus() != BookingStatus.LUNAS && booking.getStatus() != BookingStatus.SELESAI) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Refund hanya untuk booking lunas/selesai.");
    }
    booking.setRefundStatus("PENDING");
    booking.setRefundAmount(amount);
    booking.setRefundReason(reason);
    booking.setRefundRequestedAt(Instant.now());
    bookingRepo.save(booking);
    auditLogService.log(
        actorUserId,
        "ADMIN",
        "REFUND_REQUEST",
        "Booking",
        String.valueOf(bookingId),
        json("{\"amount\":\"%s\",\"reason\":\"%s\"}", amount, reason == null ? "" : reason)
    );
    return reloadWithLapangan(bookingId);
  }

  public Booking adminProcessRefund(Long bookingId, java.util.UUID actorUserId, boolean approve, BigDecimal processedAmount, String note) {
    Booking booking = bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));
    if (!"PENDING".equals(booking.getRefundStatus())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Refund tidak dalam status pending.");
    }
    if (approve) {
      booking.setRefundStatus("REFUNDED");
      booking.setRefundProcessedAt(Instant.now());
      if (processedAmount != null) {
        booking.setRefundAmount(processedAmount);
      }
    } else {
      booking.setRefundStatus("REJECTED");
      booking.setRefundProcessedAt(Instant.now());
    }
    bookingRepo.save(booking);
    auditLogService.log(
        actorUserId,
        "ADMIN",
        approve ? "REFUND_APPROVED" : "REFUND_REJECTED",
        "Booking",
        String.valueOf(bookingId),
        json("{\"note\":\"%s\",\"processedAmount\":\"%s\"}", note == null ? "" : note, processedAmount == null ? "" : processedAmount.toPlainString())
    );
    return reloadWithLapangan(bookingId);
  }

  private void ensureInvoice(Booking booking) {
    if (booking.getInvoiceNumber() != null && !booking.getInvoiceNumber().isBlank()) return;
    String date = ZonedDateTime.now(DEFAULT_ZONE).format(INVOICE_DATE);
    String inv = "INV-" + date + "-" + booking.getId();
    booking.setInvoiceNumber(inv);
    if (booking.getInvoiceIssuedAt() == null) booking.setInvoiceIssuedAt(Instant.now());
  }

  public Booking cancelBooking(UUID userId, Long bookingId) {
    Booking booking = bookingRepo.findByIdWithLapangan(bookingId)
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
          "Booking sudah lunas dan tidak bisa dibatalkan dari aplikasi."
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
    Booking saved = bookingRepo.save(booking);
    return reloadWithLapangan(saved.getId());
  }

  private Booking reloadWithLapangan(Long bookingId) {
    return bookingRepo.findByIdWithLapangan(bookingId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Booking tidak ditemukan."));
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

