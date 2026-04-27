package com.yourorg.futsal.domain.repo;

import com.yourorg.futsal.domain.entity.Lapangan;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LapanganRepository extends JpaRepository<Lapangan, Long> {
  List<Lapangan> findByIsAktifTrueOrderByIdAsc();
}

