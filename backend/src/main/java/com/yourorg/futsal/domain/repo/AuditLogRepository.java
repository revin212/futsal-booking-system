package com.yourorg.futsal.domain.repo;

import com.yourorg.futsal.domain.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
  @Query("""
      select a from AuditLog a
      order by a.createdAt desc
      """)
  List<AuditLog> findLatest(Pageable pageable);
}

