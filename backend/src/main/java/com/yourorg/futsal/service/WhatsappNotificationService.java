package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.entity.AppUser;
import com.yourorg.futsal.domain.entity.Booking;
import com.yourorg.futsal.domain.entity.NotificationLog;
import com.yourorg.futsal.domain.repo.AppUserRepository;
import com.yourorg.futsal.domain.repo.NotificationLogRepository;
import com.yourorg.futsal.domain.repo.PengaturanSistemRepository;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WhatsappNotificationService {
  private static final Logger log = LoggerFactory.getLogger(WhatsappNotificationService.class);
  private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

  public static final String TYPE_BOOKING_CREATED = "BOOKING_CREATED";
  public static final String TYPE_PAYMENT_SUCCESS = "PAYMENT_SUCCESS";
  public static final String TYPE_REMINDER = "REMINDER";

  private final PengaturanSistemRepository settingsRepo;
  private final AppUserRepository userRepo;
  private final NotificationLogRepository logRepo;

  public WhatsappNotificationService(
      PengaturanSistemRepository settingsRepo,
      AppUserRepository userRepo,
      NotificationLogRepository logRepo
  ) {
    this.settingsRepo = settingsRepo;
    this.userRepo = userRepo;
    this.logRepo = logRepo;
  }

  @Transactional
  public void notifyBookingCreated(Booking booking) {
    var user = userRepo.findById(booking.getUserId()).orElse(null);
    sendToUser("TemplateWaBookingUser", TYPE_BOOKING_CREATED, booking, user);
    sendToAdmin("TemplateWaBookingAdmin", TYPE_BOOKING_CREATED, booking, user);
  }

  @Transactional
  public void notifyPaymentSuccess(Booking booking) {
    var user = userRepo.findById(booking.getUserId()).orElse(null);
    sendToUser("TemplateWaLunas", TYPE_PAYMENT_SUCCESS, booking, user);
    sendToAdmin("TemplateWaLunas", TYPE_PAYMENT_SUCCESS, booking, user);
  }

  @Transactional
  public void notifyReminder(Booking booking) {
    if (booking.getId() != null && logRepo.existsByBookingIdAndNotificationType(booking.getId(), TYPE_REMINDER)) {
      return;
    }
    var user = userRepo.findById(booking.getUserId()).orElse(null);
    sendToUser("TemplateWaReminder", TYPE_REMINDER, booking, user);
  }

  private void sendToUser(String templateKey, String type, Booking booking, AppUser user) {
    String noHp = user == null ? null : normalizePhone(user.getNoHp());
    String recipientValue = (noHp == null || noHp.isBlank()) ? ("USER:" + booking.getUserId()) : noHp;
    String msg = render(templateKey, booking, user);
    persistAndLog(booking.getId(), templateKey, type, "USER", recipientValue, msg);
  }

  private void sendToAdmin(String templateKey, String type, Booking booking, AppUser user) {
    String adminNo = settingsRepo.findByKey("NoWhatsApp").map(s -> normalizePhone(s.getValue())).orElse(null);
    String recipientValue = (adminNo == null || adminNo.isBlank()) ? "ADMIN" : adminNo;
    String msg = render(templateKey, booking, user);
    persistAndLog(booking.getId(), templateKey, type, "ADMIN", recipientValue, msg);
  }

  private void persistAndLog(Long bookingId, String templateKey, String type, String recipientType, String recipientValue, String msg) {
    NotificationLog row = new NotificationLog();
    row.setBookingId(bookingId);
    row.setTemplateKey(templateKey);
    row.setNotificationType(type);
    row.setRecipientType(recipientType);
    row.setRecipientValue(recipientValue);
    row.setMessage(msg);
    logRepo.save(row);
    log.info("[WA_MOCK] type={} to={} message={}", type, recipientValue, msg);
  }

  private String render(String templateKey, Booking booking, AppUser user) {
    String template = settingsRepo.findByKey(templateKey).map(s -> s.getValue()).orElse("");
    String nama = user == null ? "-" : safe(user.getNamaLengkap());
    String lapangan = booking.getLapangan() == null ? "-" : safe(booking.getLapangan().getNama());
    String tanggal = booking.getTanggalMain() == null ? "-" : formatTanggal(booking.getTanggalMain());
    String jamMulai = booking.getJamMulai() == null ? "-" : HHMM.format(booking.getJamMulai());
    String jamSelesai = booking.getJamSelesai() == null ? "-" : HHMM.format(booking.getJamSelesai());
    String total = formatRupiah(booking.getTotalHarga());
    String status = booking.getStatus() == null ? "-" : booking.getStatus().name();

    return template
        .replace("{nama}", nama)
        .replace("{lapangan}", lapangan)
        .replace("{tanggal}", tanggal)
        .replace("{jamMulai}", jamMulai)
        .replace("{jamSelesai}", jamSelesai)
        .replace("{total}", total)
        .replace("{status}", status);
  }

  private String formatTanggal(LocalDate d) {
    return DateTimeFormatter.ISO_LOCAL_DATE.format(d);
  }

  private String formatRupiah(BigDecimal n) {
    BigDecimal v = n == null ? BigDecimal.ZERO : n;
    NumberFormat f = NumberFormat.getCurrencyInstance(new Locale("id", "ID"));
    return f.format(v);
  }

  private String safe(String v) {
    return v == null ? "-" : v;
  }

  private String normalizePhone(String v) {
    if (v == null) return null;
    String s = v.trim();
    if (s.isBlank()) return null;
    return s.replaceAll("[^0-9+]", "");
  }
}

