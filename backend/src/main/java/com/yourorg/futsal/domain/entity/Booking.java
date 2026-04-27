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

  public Instant getCreatedAt() {
    return createdAt;
  }
}

