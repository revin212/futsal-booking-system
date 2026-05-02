package com.yourorg.futsal.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record JamOperasionalUpsertRequest(@NotEmpty @Valid List<JamOperasionalUpsertItem> items) {}
