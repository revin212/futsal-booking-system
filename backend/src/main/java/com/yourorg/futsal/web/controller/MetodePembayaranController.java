package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.service.MetodePembayaranService;
import com.yourorg.futsal.web.dto.MetodePembayaranPublicResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/metode-pembayaran")
public class MetodePembayaranController {
  private final MetodePembayaranService metodePembayaranService;

  public MetodePembayaranController(MetodePembayaranService metodePembayaranService) {
    this.metodePembayaranService = metodePembayaranService;
  }

  /** Metode aktif untuk form booking (publik, read-only). */
  @GetMapping
  public List<MetodePembayaranPublicResponse> listActive() {
    return metodePembayaranService.listActivePublic();
  }
}
