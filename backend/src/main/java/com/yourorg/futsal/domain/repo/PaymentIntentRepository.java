package com.yourorg.futsal.domain.repo;

import com.yourorg.futsal.domain.entity.PaymentIntent;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentIntentRepository extends JpaRepository<PaymentIntent, UUID> {
  @Query("""
      select p from PaymentIntent p
      where p.bookingId = :bookingId
        and p.status = :status
      order by p.createdAt desc
      """)
  Optional<PaymentIntent> findLatestByBookingIdAndStatus(
      @Param("bookingId") Long bookingId,
      @Param("status") String status
  );

  @Modifying
  @Query("""
      update PaymentIntent p
      set p.status = :newStatus
      where p.id = :id
        and p.status = :expectedStatus
      """)
  int compareAndSetStatus(
      @Param("id") UUID id,
      @Param("expectedStatus") String expectedStatus,
      @Param("newStatus") String newStatus
  );
}

