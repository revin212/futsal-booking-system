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

@Entity
@Table(name = "foto_lapangan")
public class FotoLapangan {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "lapangan_id", nullable = false)
  private Lapangan lapangan;

  @Column(name = "file_path", nullable = false)
  private String filePath;

  @Column(name = "is_utama", nullable = false)
  private boolean isUtama = false;

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

  public String getFilePath() {
    return filePath;
  }

  public void setFilePath(String filePath) {
    this.filePath = filePath;
  }

  public boolean isUtama() {
    return isUtama;
  }

  public void setUtama(boolean utama) {
    isUtama = utama;
  }
}

