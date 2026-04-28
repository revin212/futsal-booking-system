package com.yourorg.futsal.web.dto;

public record AdminMetricsResponse(
    long pendingAktif,
    long lunasHariIni,
    long selesaiHariIni
) {}

