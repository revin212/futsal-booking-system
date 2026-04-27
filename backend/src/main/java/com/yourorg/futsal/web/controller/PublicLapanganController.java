package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.domain.repo.FotoLapanganRepository;
import com.yourorg.futsal.domain.repo.JamOperasionalRepository;
import com.yourorg.futsal.domain.repo.LapanganRepository;
import com.yourorg.futsal.web.dto.FotoLapanganResponse;
import com.yourorg.futsal.web.dto.JamOperasionalResponse;
import com.yourorg.futsal.web.dto.LapanganDetailResponse;
import com.yourorg.futsal.web.dto.LapanganListItemResponse;
import com.yourorg.futsal.web.exception.ApiException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lapangan")
public class PublicLapanganController {
  private final LapanganRepository lapanganRepo;
  private final FotoLapanganRepository fotoRepo;
  private final JamOperasionalRepository jamRepo;

  public PublicLapanganController(
      LapanganRepository lapanganRepo,
      FotoLapanganRepository fotoRepo,
      JamOperasionalRepository jamRepo
  ) {
    this.lapanganRepo = lapanganRepo;
    this.fotoRepo = fotoRepo;
    this.jamRepo = jamRepo;
  }

  @GetMapping
  public List<LapanganListItemResponse> list() {
    return lapanganRepo.findByIsAktifTrueOrderByIdAsc()
        .stream()
        .map(l -> {
          FotoLapanganResponse utama = fotoRepo.findByLapanganIdOrderByIsUtamaDescIdAsc(l.getId())
              .stream()
              .findFirst()
              .map(FotoLapanganResponse::from)
              .orElse(null);
          return LapanganListItemResponse.of(l, utama);
        })
        .toList();
  }

  @GetMapping("/{id}")
  public LapanganDetailResponse detail(@PathVariable Long id) {
    var lapangan = lapanganRepo.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Lapangan tidak ditemukan."));
    if (!lapangan.isAktif()) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Lapangan tidak ditemukan.");
    }

    var fotos = fotoRepo.findByLapanganIdOrderByIsUtamaDescIdAsc(id)
        .stream()
        .map(FotoLapanganResponse::from)
        .toList();

    var jam = jamRepo.findByLapanganIdAndIsAktifTrueOrderByHariKeAsc(id)
        .stream()
        .map(JamOperasionalResponse::from)
        .toList();

    return LapanganDetailResponse.of(lapangan, fotos, jam);
  }
}

