package com.yourorg.futsal.web.dto;

import com.yourorg.futsal.domain.entity.JamOperasional;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

public record JamOperasionalResponse(
    int hariKe,
    String jamBuka,
    String jamTutup,
    boolean isAktif
) {
  private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

  public static JamOperasionalResponse from(JamOperasional j) {
    return new JamOperasionalResponse(
        j.getHariKe(),
        format(j.getJamBuka()),
        format(j.getJamTutup()),
        j.isAktif()
    );
  }

  private static String format(LocalTime t) {
    return t == null ? null : t.format(HHMM);
  }
}

