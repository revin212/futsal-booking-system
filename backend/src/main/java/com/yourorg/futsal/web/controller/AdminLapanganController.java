package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.auth.SecurityUtils;
import com.yourorg.futsal.domain.entity.FotoLapangan;
import com.yourorg.futsal.domain.entity.JamOperasional;
import com.yourorg.futsal.domain.entity.Lapangan;
import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.domain.repo.FotoLapanganRepository;
import com.yourorg.futsal.domain.repo.JamOperasionalRepository;
import com.yourorg.futsal.domain.repo.LapanganRepository;
import com.yourorg.futsal.service.AuditLogService;
import com.yourorg.futsal.web.dto.AdminLapanganUpsertRequest;
import com.yourorg.futsal.web.dto.FotoLapanganResponse;
import com.yourorg.futsal.web.dto.JamOperasionalUpsertRequest;
import com.yourorg.futsal.web.dto.JamOperasionalUpsertItem;
import com.yourorg.futsal.web.dto.LapanganListItemResponse;
import com.yourorg.futsal.web.exception.ApiException;
import jakarta.validation.Valid;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/lapangan")
@PreAuthorize("hasRole('ADMIN')")
public class AdminLapanganController {
  private static final long MAX_UPLOAD_BYTES = 10L * 1024 * 1024;

  private final LapanganRepository lapanganRepo;
  private final FotoLapanganRepository fotoRepo;
  private final JamOperasionalRepository jamRepo;
  private final BookingRepository bookingRepo;
  private final AuditLogService auditLogService;

  public AdminLapanganController(
      LapanganRepository lapanganRepo,
      FotoLapanganRepository fotoRepo,
      JamOperasionalRepository jamRepo,
      BookingRepository bookingRepo,
      AuditLogService auditLogService
  ) {
    this.lapanganRepo = lapanganRepo;
    this.fotoRepo = fotoRepo;
    this.jamRepo = jamRepo;
    this.bookingRepo = bookingRepo;
    this.auditLogService = auditLogService;
  }

  @GetMapping
  public List<LapanganListItemResponse> list() {
    return lapanganRepo.findAll().stream()
        .sorted(Comparator.comparing(Lapangan::getId))
        .map(this::mapListItem)
        .toList();
  }

  @GetMapping("/{id}")
  public LapanganListItemResponse detail(@PathVariable Long id) {
    Lapangan l = lapanganRepo.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Lapangan tidak ditemukan."));
    return mapListItem(l);
  }

  @PostMapping
  @Transactional
  public LapanganListItemResponse create(@Valid @RequestBody AdminLapanganUpsertRequest req) {
    Lapangan l = new Lapangan();
    applyUpsert(l, req);
    Lapangan saved = lapanganRepo.save(l);
    seedJamDefaults(saved.getId());
    auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "LAPANGAN_CREATE", "Lapangan", String.valueOf(saved.getId()), "{}");
    return mapListItem(lapanganRepo.findById(saved.getId()).orElseThrow());
  }

  @PutMapping("/{id}")
  @Transactional
  public LapanganListItemResponse update(@PathVariable Long id, @Valid @RequestBody AdminLapanganUpsertRequest req) {
    Lapangan l = lapanganRepo.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Lapangan tidak ditemukan."));
    applyUpsert(l, req);
    lapanganRepo.save(l);
    auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "LAPANGAN_UPDATE", "Lapangan", String.valueOf(id), "{}");
    return mapListItem(lapanganRepo.findById(id).orElseThrow());
  }

  @DeleteMapping("/{id}")
  @Transactional
  public void delete(@PathVariable Long id) {
    Lapangan l = lapanganRepo.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Lapangan tidak ditemukan."));
    long cnt = bookingRepo.countByLapangan_Id(id);
    if (cnt > 0) {
      l.setAktif(false);
      lapanganRepo.save(l);
      auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "LAPANGAN_SOFT_DELETE", "Lapangan", String.valueOf(id), "{\"reason\":\"has_bookings\"}");
      return;
    }
    jamRepo.deleteByLapangan_Id(id);
    fotoRepo.deleteAll(fotoRepo.findByLapanganIdOrderByIsUtamaDescIdAsc(id));
    lapanganRepo.delete(l);
    auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "LAPANGAN_DELETE", "Lapangan", String.valueOf(id), "{}");
  }

  @GetMapping("/{id}/foto")
  public List<FotoLapanganResponse> listFoto(@PathVariable Long id) {
    ensureLapangan(id);
    return fotoRepo.findByLapanganIdOrderByIsUtamaDescIdAsc(id).stream().map(FotoLapanganResponse::from).toList();
  }

  @PostMapping(value = "/{id}/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Transactional
  public FotoLapanganResponse uploadFoto(@PathVariable Long id, MultipartFile file) {
    Lapangan lapangan = ensureLapangan(id);
    if (file == null || file.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "File wajib diupload.");
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
    String filename = "foto-" + UUID.randomUUID() + safeExt;
    Path uploadDir = Paths.get("storage", "uploads", "lapangan-" + id);
    try {
      Files.createDirectories(uploadDir);
      Path dest = uploadDir.resolve(filename).normalize();
      if (!dest.startsWith(uploadDir.normalize())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Nama file tidak valid.");
      }
      try (InputStream in = file.getInputStream()) {
        Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
      }
      String relative = Paths.get("uploads", "lapangan-" + id, filename).toString().replace("\\", "/");
      FotoLapangan f = new FotoLapangan();
      f.setLapangan(lapangan);
      f.setFilePath("/" + relative);
      boolean first = fotoRepo.findByLapanganIdOrderByIsUtamaDescIdAsc(id).isEmpty();
      f.setUtama(first);
      FotoLapangan saved = fotoRepo.save(f);
      auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "LAPANGAN_FOTO_UPLOAD", "FotoLapangan", String.valueOf(saved.getId()), "{}");
      return FotoLapanganResponse.from(saved);
    } catch (ApiException e) {
      throw e;
    } catch (Exception e) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "Gagal menyimpan foto.");
    }
  }

  @PatchMapping("/{lapanganId}/foto/{fotoId}/utama")
  @Transactional
  public void setUtama(@PathVariable Long lapanganId, @PathVariable Long fotoId) {
    ensureLapangan(lapanganId);
    List<FotoLapangan> fotos = fotoRepo.findByLapanganIdOrderByIsUtamaDescIdAsc(lapanganId);
    for (FotoLapangan f : fotos) {
      f.setUtama(f.getId().equals(fotoId));
    }
    fotoRepo.saveAll(fotos);
    auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "LAPANGAN_FOTO_UTAMA", "FotoLapangan", String.valueOf(fotoId), "{}");
  }

  @DeleteMapping("/{lapanganId}/foto/{fotoId}")
  @Transactional
  public void deleteFoto(@PathVariable Long lapanganId, @PathVariable Long fotoId) {
    ensureLapangan(lapanganId);
    FotoLapangan f = fotoRepo.findById(fotoId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Foto tidak ditemukan."));
    if (!f.getLapangan().getId().equals(lapanganId)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Foto tidak untuk lapangan ini.");
    }
    fotoRepo.delete(f);
    auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "LAPANGAN_FOTO_DELETE", "FotoLapangan", String.valueOf(fotoId), "{}");
  }

  @GetMapping("/{id}/jam-operasional")
  public List<JamOperasionalResponse> listJam(@PathVariable Long id) {
    ensureLapangan(id);
    return jamRepo.findByLapangan_IdOrderByHariKeAsc(id).stream()
        .map(JamOperasionalResponse::from)
        .toList();
  }

  @PutMapping("/{id}/jam-operasional")
  @Transactional
  public List<JamOperasionalResponse> upsertJam(@PathVariable Long id, @Valid @RequestBody JamOperasionalUpsertRequest req) {
    Lapangan lapangan = ensureLapangan(id);
    jamRepo.deleteByLapangan_Id(id);
    for (JamOperasionalUpsertItem it : req.items()) {
      JamOperasional j = new JamOperasional();
      j.setLapangan(lapangan);
      j.setHariKe(it.hariKe());
      j.setJamBuka(it.jamBuka());
      j.setJamTutup(it.jamTutup());
      j.setAktif(it.isAktif());
      jamRepo.save(j);
    }
    auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "LAPANGAN_JAM_UPDATE", "Lapangan", String.valueOf(id), "{}");
    return jamRepo.findByLapangan_IdOrderByHariKeAsc(id).stream().map(JamOperasionalResponse::from).toList();
  }

  private Lapangan ensureLapangan(Long id) {
    return lapanganRepo.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Lapangan tidak ditemukan."));
  }

  private void applyUpsert(Lapangan l, AdminLapanganUpsertRequest req) {
    l.setNama(req.nama().trim());
    l.setTipe(req.tipe().trim());
    l.setDeskripsi(req.deskripsi());
    l.setFasilitas(toJsonArray(req.fasilitas()));
    l.setHargaRegular(req.hargaRegular());
    l.setHargaPeakHour(req.hargaPeakHour());
    l.setHargaWeekend(req.hargaWeekend());
    l.setAktif(req.isAktif());
  }

  private void seedJamDefaults(Long lapanganId) {
    Lapangan lap = lapanganRepo.findById(lapanganId).orElseThrow();
    for (int h = 0; h <= 6; h++) {
      JamOperasional j = new JamOperasional();
      j.setLapangan(lap);
      j.setHariKe(h);
      j.setJamBuka(java.time.LocalTime.of(7, 0));
      j.setJamTutup(java.time.LocalTime.of(23, 0));
      j.setAktif(true);
      jamRepo.save(j);
    }
  }

  private static String toJsonArray(List<String> fasilitas) {
    if (fasilitas == null || fasilitas.isEmpty()) {
      return "[]";
    }
    StringBuilder sb = new StringBuilder("[");
    for (int i = 0; i < fasilitas.size(); i++) {
      if (i > 0) sb.append(",");
      sb.append("\"").append(String.valueOf(fasilitas.get(i)).replace("\\", "\\\\").replace("\"", "\\\"")).append("\"");
    }
    sb.append("]");
    return sb.toString();
  }

  private LapanganListItemResponse mapListItem(Lapangan l) {
    var fotos = fotoRepo.findByLapanganIdOrderByIsUtamaDescIdAsc(l.getId());
    FotoLapanganResponse fotoUtama = fotos.stream().findFirst().map(FotoLapanganResponse::from).orElse(null);
    return LapanganListItemResponse.of(l, fotoUtama);
  }

  public record JamOperasionalResponse(long id, int hariKe, java.time.LocalTime jamBuka, java.time.LocalTime jamTutup, boolean isAktif) {
    static JamOperasionalResponse from(JamOperasional j) {
      return new JamOperasionalResponse(j.getId(), j.getHariKe(), j.getJamBuka(), j.getJamTutup(), j.isAktif());
    }
  }
}
