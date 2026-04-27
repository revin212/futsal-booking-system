package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.service.KalenderService;
import com.yourorg.futsal.web.dto.KalenderEventResponse;
import java.time.LocalDate;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/kalender")
public class PublicKalenderController {
  private final KalenderService kalenderService;

  public PublicKalenderController(KalenderService kalenderService) {
    this.kalenderService = kalenderService;
  }

  @GetMapping
  public List<KalenderEventResponse> events(
      @RequestParam Long lapanganId,
      @RequestParam LocalDate start,
      @RequestParam LocalDate end
  ) {
    return kalenderService.getEvents(lapanganId, start, end);
  }
}

