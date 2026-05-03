package com.yourorg.futsal.domain.repo;

import com.yourorg.futsal.domain.entity.MetodePembayaran;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MetodePembayaranRepository extends JpaRepository<MetodePembayaran, Long> {
  Optional<MetodePembayaran> findByKodeIgnoreCase(String kode);

  List<MetodePembayaran> findAllByAktifIsTrueOrderByUrutanAscIdAsc();

  List<MetodePembayaran> findAllByOrderByUrutanAscIdAsc();
}
