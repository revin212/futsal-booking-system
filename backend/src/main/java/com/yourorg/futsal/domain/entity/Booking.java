package com.yourorg.futsal.domain.entity;

import com.yourorg.futsal.domain.enums.BookingStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "booking")
public class Booking {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "lapangan_id", nullable = false)
  private Lapangan lapangan;

  @Column(name = "tanggal_main", nullable = false)
  private LocalDate tanggalMain;

  @Column(name = "jam_mulai", nullable = false)
  private LocalTime jamMulai;

  @Column(name = "jam_selesai", nullable = false)
  private LocalTime jamSelesai;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private BookingStatus status = BookingStatus.DIBUAT;

  @Column(name = "total_harga", precision = 12, scale = 2)
  private BigDecimal totalHarga;

  @Column(name = "metode_pembayaran")
  private String metodePembayaran;

  @Column(name = "admin_fee", precision = 12, scale = 2)
  private BigDecimal adminFee;

  @Column(name = "dp_nominal", precision = 12, scale = 2)
  private BigDecimal dpNominal;

  @Column(name = "paid_amount", precision = 12, scale = 2)
  private BigDecimal paidAmount;

  @Column(name = "bukti_bayar_path")
  private String buktiBayarPath;

  @Column(name = "verified_at")
  private Instant verifiedAt;

  @Column(name = "invoice_number")
  private String invoiceNumber;

  @Column(name = "invoice_issued_at")
  private Instant invoiceIssuedAt;

  @Column(name = "refund_status", nullable = false)
  private String refundStatus = "NONE";

  @Column(name = "refund_requested_at")
  private Instant refundRequestedAt;

  @Column(name = "refund_processed_at")
  private Instant refundProcessedAt;

  @Column(name = "refund_reason")
  private String refundReason;

  @Column(name = "refund_amount", precision = 12, scale = 2)
  private BigDecimal refundAmount;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public Lapangan getLapangan() {
    return lapangan;
  }

  public void setLapangan(Lapangan lapangan) {
    this.lapangan = lapangan;
  }

  public LocalDate getTanggalMain() {
    return tanggalMain;
  }

  public void setTanggalMain(LocalDate tanggalMain) {
    this.tanggalMain = tanggalMain;
  }

  public LocalTime getJamMulai() {
    return jamMulai;
  }

  public void setJamMulai(LocalTime jamMulai) {
    this.jamMulai = jamMulai;
  }

  public LocalTime getJamSelesai() {
    return jamSelesai;
  }

  public void setJamSelesai(LocalTime jamSelesai) {
    this.jamSelesai = jamSelesai;
  }

  public BookingStatus getStatus() {
    return status;
  }

  public void setStatus(BookingStatus status) {
    this.status = status;
  }

  public BigDecimal getTotalHarga() {
    return totalHarga;
  }

  public void setTotalHarga(BigDecimal totalHarga) {
    this.totalHarga = totalHarga;
  }

  public String getMetodePembayaran() {
    return metodePembayaran;
  }

  public void setMetodePembayaran(String metodePembayaran) {
    this.metodePembayaran = metodePembayaran;
  }

  public BigDecimal getAdminFee() {
    return adminFee;
  }

  public void setAdminFee(BigDecimal adminFee) {
    this.adminFee = adminFee;
  }

  public BigDecimal getDpNominal() {
    return dpNominal;
  }

  public void setDpNominal(BigDecimal dpNominal) {
    this.dpNominal = dpNominal;
  }

  public BigDecimal getPaidAmount() {
    return paidAmount;
  }

  public void setPaidAmount(BigDecimal paidAmount) {
    this.paidAmount = paidAmount;
  }

  public String getBuktiBayarPath() {
    return buktiBayarPath;
  }

  public void setBuktiBayarPath(String buktiBayarPath) {
    this.buktiBayarPath = buktiBayarPath;
  }

  public Instant getVerifiedAt() {
    return verifiedAt;
  }

  public void setVerifiedAt(Instant verifiedAt) {
    this.verifiedAt = verifiedAt;
  }

  public String getInvoiceNumber() {
    return invoiceNumber;
  }

  public void setInvoiceNumber(String invoiceNumber) {
    this.invoiceNumber = invoiceNumber;
  }

  public Instant getInvoiceIssuedAt() {
    return invoiceIssuedAt;
  }

  public void setInvoiceIssuedAt(Instant invoiceIssuedAt) {
    this.invoiceIssuedAt = invoiceIssuedAt;
  }

  public String getRefundStatus() {
    return refundStatus;
  }

  public void setRefundStatus(String refundStatus) {
    this.refundStatus = refundStatus;
  }

  public Instant getRefundRequestedAt() {
    return refundRequestedAt;
  }

  public void setRefundRequestedAt(Instant refundRequestedAt) {
    this.refundRequestedAt = refundRequestedAt;
  }

  public Instant getRefundProcessedAt() {
    return refundProcessedAt;
  }

  public void setRefundProcessedAt(Instant refundProcessedAt) {
    this.refundProcessedAt = refundProcessedAt;
  }

  public String getRefundReason() {
    return refundReason;
  }

  public void setRefundReason(String refundReason) {
    this.refundReason = refundReason;
  }

  public BigDecimal getRefundAmount() {
    return refundAmount;
  }

  public void setRefundAmount(BigDecimal refundAmount) {
    this.refundAmount = refundAmount;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}

