package com.yourorg.futsal.domain.repo;

import com.yourorg.futsal.domain.entity.Booking;
import com.yourorg.futsal.domain.enums.BookingStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long> {
  @Query("""
      select b from Booking b
      where b.lapangan.id = :lapanganId
        and b.tanggalMain between :start and :end
        and b.status <> :statusBatal
        and not (b.status = :statusPending and b.createdAt < :cutoff)
      order by b.tanggalMain asc, b.jamMulai asc
      """)
  List<Booking> findByLapanganIdBetweenNonCancelledNonExpiredPending(
      @Param("lapanganId") Long lapanganId,
      @Param("start") LocalDate start,
      @Param("end") LocalDate end,
      @Param("statusBatal") BookingStatus statusBatal,
      @Param("statusPending") BookingStatus statusPending,
      @Param("cutoff") Instant cutoff
  );

  @Query("""
      select b from Booking b
      where b.lapangan.id = :lapanganId
        and b.tanggalMain = :tanggal
        and b.status <> :statusBatal
        and not (b.status = :statusPending and b.createdAt < :cutoff)
      order by b.jamMulai asc
      """)
  List<Booking> findByLapanganIdAndTanggalMainNonCancelledNonExpiredPending(
      @Param("lapanganId") Long lapanganId,
      @Param("tanggal") LocalDate tanggal,
      @Param("statusBatal") BookingStatus statusBatal,
      @Param("statusPending") BookingStatus statusPending,
      @Param("cutoff") Instant cutoff
  );

  @Query("""
      select b from Booking b
      join fetch b.lapangan l
      where b.userId = :userId
      order by b.createdAt desc
      """)
  List<Booking> findByUserIdWithLapanganOrderByCreatedAtDesc(@Param("userId") UUID userId);

  @Query("""
      select b from Booking b
      join fetch b.lapangan l
      where b.status = :status
      order by b.createdAt desc
      """)
  List<Booking> findByStatusWithLapanganOrderByCreatedAtDesc(@Param("status") BookingStatus status);

  @Query("""
      select b from Booking b
      join fetch b.lapangan l
      where b.status = :status
        and b.tanggalMain = :tanggal
      order by b.jamMulai asc
      """)
  List<Booking> findByStatusAndTanggalMainWithLapangan(
      @Param("status") BookingStatus status,
      @Param("tanggal") LocalDate tanggal
  );

  @Query("""
      select b from Booking b
      join fetch b.lapangan l
      where b.tanggalMain between :start and :end
      order by b.tanggalMain asc, b.jamMulai asc
      """)
  List<Booking> findByTanggalMainBetweenWithLapangan(
      @Param("start") LocalDate start,
      @Param("end") LocalDate end
  );

  @Query("""
      select b from Booking b
      join fetch b.lapangan l
      where b.id = :id
      """)
  Optional<Booking> findByIdWithLapangan(@Param("id") Long id);

  @Query("""
      select b from Booking b
      where b.lapangan.id = :lapanganId
        and b.tanggalMain = :tanggal
        and b.status <> :statusBatal
        and not (b.status = :statusPending and b.createdAt < :cutoff)
        and b.jamMulai < :jamSelesai
        and b.jamSelesai > :jamMulai
      order by b.jamMulai asc
      """)
  List<Booking> findOverlappingNonCancelledNonExpiredPending(
      @Param("lapanganId") Long lapanganId,
      @Param("tanggal") LocalDate tanggal,
      @Param("jamMulai") LocalTime jamMulai,
      @Param("jamSelesai") LocalTime jamSelesai,
      @Param("statusBatal") BookingStatus statusBatal,
      @Param("statusPending") BookingStatus statusPending,
      @Param("cutoff") Instant cutoff
  );

  @Modifying
  @Query("""
      update Booking b
      set b.status = :statusBatal
      where b.status = :statusPending
        and b.createdAt < :cutoff
      """)
  int expirePendingPayments(
      @Param("statusPending") BookingStatus statusPending,
      @Param("statusBatal") BookingStatus statusBatal,
      @Param("cutoff") Instant cutoff
  );

  @Modifying
  @Query("""
      update Booking b
      set b.status = :statusSelesai
      where b.status = :statusLunas
        and (
          b.tanggalMain < :today
          or (b.tanggalMain = :today and b.jamSelesai <= :nowTime)
        )
      """)
  int markCompletedAfterEndTime(
      @Param("statusLunas") BookingStatus statusLunas,
      @Param("statusSelesai") BookingStatus statusSelesai,
      @Param("today") LocalDate today,
      @Param("nowTime") LocalTime nowTime
  );

  @Query("""
      select count(b) from Booking b
      where b.status = :statusPending
        and b.createdAt >= :cutoff
      """)
  long countActivePending(@Param("statusPending") BookingStatus statusPending, @Param("cutoff") Instant cutoff);

  @Query("""
      select count(b) from Booking b
      where b.status = :status
        and b.tanggalMain = :tanggal
      """)
  long countByStatusAndTanggalMain(@Param("status") BookingStatus status, @Param("tanggal") LocalDate tanggal);

  long countByLapangan_Id(Long lapanganId);

  @Query("""
      select b from Booking b
      join fetch b.lapangan l
      where b.refundStatus = :refundStatus
      order by b.refundRequestedAt desc nulls last, b.id desc
      """)
  List<Booking> findByRefundStatusWithLapangan(@Param("refundStatus") String refundStatus);

  @Query("""
      select b from Booking b
      join fetch b.lapangan l
      where b.tanggalMain between :start and :end
        and b.status in :statuses
      """)
  List<Booking> findByTanggalMainBetweenAndStatusInWithLapangan(
      @Param("start") LocalDate start,
      @Param("end") LocalDate end,
      @Param("statuses") List<BookingStatus> statuses
  );
}

