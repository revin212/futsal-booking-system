package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.domain.repo.LapanganRepository;
import com.yourorg.futsal.service.SlotService;
import com.yourorg.futsal.web.dto.SlotHariIniResponse;
import com.yourorg.futsal.web.dto.SlotResponse;
import com.yourorg.futsal.web.exception.ApiException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PublicSlotController {
  private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Jakarta");

  private final LapanganRepository lapanganRepo;
  private final SlotService slotService;

  public PublicSlotController(LapanganRepository lapanganRepo, SlotService slotService) {
    this.lapanganRepo = lapanganRepo;
    this.slotService = slotService;
  }

  @GetMapping("/slot-hari-ini")
  public SlotHariIniResponse slotHariIni(@RequestParam(name = "lapanganId", required = false) Long lapanganId) {
    var lapangan = (lapanganId != null)
        ? lapanganRepo.findById(lapanganId).orElse(null)
        : lapanganRepo.findByIsAktifTrueOrderByIdAsc().stream().findFirst().orElse(null);

    if (lapangan == null || !lapangan.isAktif()) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Lapangan tidak ditemukan.");
    }

    LocalDate today = LocalDate.now(DEFAULT_ZONE);
    List<SlotResponse> slots = slotService.getSlot(lapangan.getId(), today);
    return new SlotHariIniResponse(lapangan.getId(), lapangan.getNama(), today, slots);
  }

  @GetMapping("/slot")
  public List<SlotResponse> slot(
      @RequestParam Long lapanganId,
      @RequestParam LocalDate tanggal
  ) {
    return slotService.getSlot(lapanganId, tanggal);
  }
}

