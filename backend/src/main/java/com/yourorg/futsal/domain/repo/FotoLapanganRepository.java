package com.yourorg.futsal.domain.repo;

import com.yourorg.futsal.domain.entity.FotoLapangan;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FotoLapanganRepository extends JpaRepository<FotoLapangan, Long> {
  List<FotoLapangan> findByLapanganIdOrderByIsUtamaDescIdAsc(Long lapanganId);
}

