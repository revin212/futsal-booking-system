package com.yourorg.futsal.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "lapangan")
public class Lapangan {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String nama;

  @Column(nullable = false)
  private String tipe;

  @Column
  private String deskripsi;

  @Column(nullable = false)
  private String fasilitas;

  @Column(name = "harga_regular", nullable = false, precision = 12, scale = 2)
  private BigDecimal hargaRegular;

  @Column(name = "harga_peak_hour", nullable = false, precision = 12, scale = 2)
  private BigDecimal hargaPeakHour;

  @Column(name = "harga_weekend", nullable = false, precision = 12, scale = 2)
  private BigDecimal hargaWeekend;

  @Column(name = "is_aktif", nullable = false)
  private boolean isAktif = true;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @OneToMany(mappedBy = "lapangan")
  private List<FotoLapangan> fotos = new ArrayList<>();

  @OneToMany(mappedBy = "lapangan")
  private List<JamOperasional> jamOperasional = new ArrayList<>();

  @OneToMany(mappedBy = "lapangan")
  private List<Booking> bookings = new ArrayList<>();

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getNama() {
    return nama;
  }

  public void setNama(String nama) {
    this.nama = nama;
  }

  public String getTipe() {
    return tipe;
  }

  public void setTipe(String tipe) {
    this.tipe = tipe;
  }

  public String getDeskripsi() {
    return deskripsi;
  }

  public void setDeskripsi(String deskripsi) {
    this.deskripsi = deskripsi;
  }

  public String getFasilitas() {
    return fasilitas;
  }

  public void setFasilitas(String fasilitas) {
    this.fasilitas = fasilitas;
  }

  public BigDecimal getHargaRegular() {
    return hargaRegular;
  }

  public void setHargaRegular(BigDecimal hargaRegular) {
    this.hargaRegular = hargaRegular;
  }

  public BigDecimal getHargaPeakHour() {
    return hargaPeakHour;
  }

  public void setHargaPeakHour(BigDecimal hargaPeakHour) {
    this.hargaPeakHour = hargaPeakHour;
  }

  public BigDecimal getHargaWeekend() {
    return hargaWeekend;
  }

  public void setHargaWeekend(BigDecimal hargaWeekend) {
    this.hargaWeekend = hargaWeekend;
  }

  public boolean isAktif() {
    return isAktif;
  }

  public void setAktif(boolean aktif) {
    isAktif = aktif;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public List<FotoLapangan> getFotos() {
    return fotos;
  }

  public void setFotos(List<FotoLapangan> fotos) {
    this.fotos = fotos;
  }

  public List<JamOperasional> getJamOperasional() {
    return jamOperasional;
  }

  public void setJamOperasional(List<JamOperasional> jamOperasional) {
    this.jamOperasional = jamOperasional;
  }

  public List<Booking> getBookings() {
    return bookings;
  }

  public void setBookings(List<Booking> bookings) {
    this.bookings = bookings;
  }
}

