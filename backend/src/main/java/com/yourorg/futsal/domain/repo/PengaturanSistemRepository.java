package com.yourorg.futsal.domain.repo;

import com.yourorg.futsal.domain.entity.PengaturanSistem;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PengaturanSistemRepository extends JpaRepository<PengaturanSistem, Long> {
  Optional<PengaturanSistem> findByKey(String key);
}

