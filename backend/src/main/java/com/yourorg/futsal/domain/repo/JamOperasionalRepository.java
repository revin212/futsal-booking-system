package com.yourorg.futsal.domain.repo;

import com.yourorg.futsal.domain.entity.JamOperasional;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JamOperasionalRepository extends JpaRepository<JamOperasional, Long> {
  List<JamOperasional> findByLapanganIdAndIsAktifTrueOrderByHariKeAsc(Long lapanganId);

  List<JamOperasional> findByLapangan_IdOrderByHariKeAsc(Long lapanganId);

  void deleteByLapangan_Id(Long lapanganId);
}

