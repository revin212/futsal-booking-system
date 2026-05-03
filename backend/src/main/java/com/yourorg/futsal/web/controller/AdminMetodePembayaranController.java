package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.auth.SecurityUtils;
import com.yourorg.futsal.domain.entity.MetodePembayaran;
import com.yourorg.futsal.domain.repo.MetodePembayaranRepository;
import com.yourorg.futsal.service.AuditLogService;
import com.yourorg.futsal.service.MetodePembayaranService;
import com.yourorg.futsal.web.dto.MetodePembayaranAdminResponse;
import com.yourorg.futsal.web.dto.MetodePembayaranUpsertRequest;
import com.yourorg.futsal.web.exception.ApiException;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/metode-pembayaran")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMetodePembayaranController {
  private final MetodePembayaranRepository repo;
  private final AuditLogService auditLogService;

  public AdminMetodePembayaranController(MetodePembayaranRepository repo, AuditLogService auditLogService) {
    this.repo = repo;
    this.auditLogService = auditLogService;
  }

  @GetMapping
  public List<MetodePembayaranAdminResponse> listAll() {
    return repo.findAllByOrderByUrutanAscIdAsc().stream().map(MetodePembayaranAdminResponse::from).toList();
  }

  @PostMapping
  @Transactional
  public MetodePembayaranAdminResponse create(@Valid @RequestBody MetodePembayaranUpsertRequest req) {
    String kode = MetodePembayaranService.normalizeKode(req.kode());
    if (kode.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Kode tidak boleh kosong.");
    }
    if ("CASH".equalsIgnoreCase(kode)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Metode CASH bersifat sistem.");
    }
    if (repo.findByKodeIgnoreCase(kode).isPresent()) {
      throw new ApiException(HttpStatus.CONFLICT, "Conflict", "Kode metode sudah dipakai.");
    }
    MetodePembayaran m = new MetodePembayaran();
    applyUpsert(m, req, kode);
    m = repo.save(m);
    auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "METODE_PEMBAYARAN_CREATE", "MetodePembayaran", String.valueOf(m.getId()), "{}");
    return MetodePembayaranAdminResponse.from(m);
  }

  @PutMapping("/{id}")
  @Transactional
  public MetodePembayaranAdminResponse update(@PathVariable Long id, @Valid @RequestBody MetodePembayaranUpsertRequest req) {
    MetodePembayaran m =
        repo.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Metode tidak ditemukan."));
    if ("CASH".equalsIgnoreCase(m.getKode())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Metode CASH tidak dapat diubah.");
    }
    String kode = MetodePembayaranService.normalizeKode(req.kode());
    if (kode.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Kode tidak boleh kosong.");
    }
    if ("CASH".equalsIgnoreCase(kode)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Tidak dapat menggunakan kode CASH.");
    }
    repo
        .findByKodeIgnoreCase(kode)
        .filter(other -> !other.getId().equals(id))
        .ifPresent(x -> {
          throw new ApiException(HttpStatus.CONFLICT, "Conflict", "Kode metode sudah dipakai.");
        });
    applyUpsert(m, req, kode);
    m = repo.save(m);
    auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "METODE_PEMBAYARAN_UPDATE", "MetodePembayaran", String.valueOf(id), "{}");
    return MetodePembayaranAdminResponse.from(m);
  }

  /** Nonaktifkan metode (soft delete). */
  @DeleteMapping("/{id}")
  @Transactional
  public MetodePembayaranAdminResponse deactivate(@PathVariable Long id) {
    MetodePembayaran m =
        repo.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Metode tidak ditemukan."));
    if ("CASH".equalsIgnoreCase(m.getKode())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Metode CASH tidak dapat dinonaktifkan.");
    }
    m.setAktif(false);
    m = repo.save(m);
    auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "METODE_PEMBAYARAN_DEACTIVATE", "MetodePembayaran", String.valueOf(id), "{}");
    return MetodePembayaranAdminResponse.from(m);
  }

  private static void applyUpsert(MetodePembayaran m, MetodePembayaranUpsertRequest req, String kodeNormalized) {
    m.setKode(kodeNormalized);
    m.setNamaLabel(req.namaLabel().trim());
    m.setAdminFee(req.adminFee().max(java.math.BigDecimal.ZERO));
    m.setUrutan(req.urutan());
    m.setAktif(req.aktif());
    // Hanya metode CASH (seed) yang tanpa gateway; tidak diatur lewat form admin.
    m.setTanpaPaymentGateway(false);
  }
}
