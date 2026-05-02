package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.service.KalenderService;
import com.yourorg.futsal.web.dto.KalenderEventResponse;
import java.time.LocalDate;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/kalender")
@PreAuthorize("hasRole('ADMIN')")
public class AdminKalenderController {
  private final KalenderService kalenderService;

  public AdminKalenderController(KalenderService kalenderService) {
    this.kalenderService = kalenderService;
  }

  @GetMapping
  public List<KalenderEventResponse> events(
      @RequestParam("lapanganId") Long lapanganId,
      @RequestParam("start") LocalDate start,
      @RequestParam("end") LocalDate end
  ) {
    return kalenderService.getEventsForAdmin(lapanganId, start, end);
  }
}
