package com.yourorg.futsal.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalTime;

@Entity
@Table(name = "jam_operasional")
public class JamOperasional {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "lapangan_id", nullable = false)
  private Lapangan lapangan;

  @Column(name = "hari_ke", nullable = false)
  private int hariKe;

  @Column(name = "jam_buka", nullable = false)
  private LocalTime jamBuka;

  @Column(name = "jam_tutup", nullable = false)
  private LocalTime jamTutup;

  @Column(name = "is_aktif", nullable = false)
  private boolean isAktif = true;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Lapangan getLapangan() {
    return lapangan;
  }

  public void setLapangan(Lapangan lapangan) {
    this.lapangan = lapangan;
  }

  public int getHariKe() {
    return hariKe;
  }

  public void setHariKe(int hariKe) {
    this.hariKe = hariKe;
  }

  public LocalTime getJamBuka() {
    return jamBuka;
  }

  public void setJamBuka(LocalTime jamBuka) {
    this.jamBuka = jamBuka;
  }

  public LocalTime getJamTutup() {
    return jamTutup;
  }

  public void setJamTutup(LocalTime jamTutup) {
    this.jamTutup = jamTutup;
  }

  public boolean isAktif() {
    return isAktif;
  }

  public void setAktif(boolean aktif) {
    isAktif = aktif;
  }
}

