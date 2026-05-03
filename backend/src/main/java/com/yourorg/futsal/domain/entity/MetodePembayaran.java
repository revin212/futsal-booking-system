package com.yourorg.futsal.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "metode_pembayaran")
public class MetodePembayaran {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 32)
  private String kode;

  @Column(name = "nama_label", nullable = false, length = 128)
  private String namaLabel;

  @Column(name = "admin_fee", nullable = false, precision = 12, scale = 2)
  private BigDecimal adminFee = BigDecimal.ZERO;

  @Column(nullable = false)
  private int urutan;

  @Column(nullable = false)
  private boolean aktif = true;

  @Column(name = "tanpa_payment_gateway", nullable = false)
  private boolean tanpaPaymentGateway;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @PrePersist
  void prePersist() {
    Instant n = Instant.now();
    if (createdAt == null) createdAt = n;
    updatedAt = n;
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getKode() {
    return kode;
  }

  public void setKode(String kode) {
    this.kode = kode;
  }

  public String getNamaLabel() {
    return namaLabel;
  }

  public void setNamaLabel(String namaLabel) {
    this.namaLabel = namaLabel;
  }

  public BigDecimal getAdminFee() {
    return adminFee;
  }

  public void setAdminFee(BigDecimal adminFee) {
    this.adminFee = adminFee;
  }

  public int getUrutan() {
    return urutan;
  }

  public void setUrutan(int urutan) {
    this.urutan = urutan;
  }

  public boolean isAktif() {
    return aktif;
  }

  public void setAktif(boolean aktif) {
    this.aktif = aktif;
  }

  public boolean isTanpaPaymentGateway() {
    return tanpaPaymentGateway;
  }

  public void setTanpaPaymentGateway(boolean tanpaPaymentGateway) {
    this.tanpaPaymentGateway = tanpaPaymentGateway;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
