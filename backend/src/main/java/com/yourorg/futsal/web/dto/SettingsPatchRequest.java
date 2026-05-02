package com.yourorg.futsal.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record SettingsPatchRequest(@NotEmpty @Valid List<SettingEntry> entries) {
  public record SettingEntry(String key, String value) {}
}
