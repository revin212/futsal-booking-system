package com.yourorg.futsal.domain.repo;

import com.yourorg.futsal.domain.entity.NotificationLog;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
  @Query("""
      select (count(n) > 0) from NotificationLog n
      where n.bookingId = :bookingId
        and n.notificationType = :type
      """)
  boolean existsByBookingIdAndNotificationType(@Param("bookingId") Long bookingId, @Param("type") String type);

  @Query("""
      select n from NotificationLog n
      order by n.createdAt desc
      """)
  List<NotificationLog> findLatest(Pageable pageable);
}

