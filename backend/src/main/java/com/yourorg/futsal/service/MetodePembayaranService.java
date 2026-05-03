package com.yourorg.futsal.service;

import com.yourorg.futsal.domain.entity.MetodePembayaran;
import com.yourorg.futsal.domain.repo.MetodePembayaranRepository;
import com.yourorg.futsal.web.dto.MetodePembayaranPublicResponse;
import com.yourorg.futsal.web.exception.ApiException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class MetodePembayaranService {
  private final MetodePembayaranRepository repo;

  public MetodePembayaranService(MetodePembayaranRepository repo) {
    this.repo = repo;
  }

  public List<MetodePembayaranPublicResponse> listActivePublic() {
    return repo.findAllByAktifIsTrueOrderByUrutanAscIdAsc().stream()
        .map(MetodePembayaranPublicResponse::from)
        .toList();
  }

  /**
   * Validates payment method exists and is active; used when creating a booking.
   */
  public MetodePembayaran requireActiveForBooking(String kodeRaw) {
    String kode = normalizeKode(kodeRaw);
    if (kode.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Metode pembayaran wajib dipilih.");
    }
    MetodePembayaran m =
        repo.findByKodeIgnoreCase(kode).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Metode pembayaran tidak valid."));
    if (!m.isAktif()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Metode pembayaran tidak aktif.");
    }
    return m;
  }

  public static String normalizeKode(String kodeRaw) {
    return kodeRaw == null ? "" : kodeRaw.trim().toUpperCase();
  }
}
