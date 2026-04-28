package com.yourorg.futsal.domain.repo;

import com.yourorg.futsal.domain.entity.Booking;
import com.yourorg.futsal.domain.enums.BookingStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long> {
  List<Booking> findByLapanganIdAndTanggalMainBetweenOrderByTanggalMainAscJamMulaiAsc(
      Long lapanganId, LocalDate start, LocalDate end);

  @Query("""
      select b from Booking b
      where b.lapangan.id = :lapanganId
        and b.tanggalMain = :tanggal
        and b.status <> :statusBatal
      order by b.jamMulai asc
      """)
  List<Booking> findByLapanganIdAndTanggalMainNonCancelled(
      @Param("lapanganId") Long lapanganId,
      @Param("tanggal") LocalDate tanggal,
      @Param("statusBatal") BookingStatus statusBatal
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
      where b.id = :id
      """)
  Optional<Booking> findByIdWithLapangan(@Param("id") Long id);

  @Query("""
      select b from Booking b
      where b.lapangan.id = :lapanganId
        and b.tanggalMain = :tanggal
        and b.status <> :statusBatal
        and b.jamMulai < :jamSelesai
        and b.jamSelesai > :jamMulai
      order by b.jamMulai asc
      """)
  List<Booking> findOverlappingNonCancelled(
      @Param("lapanganId") Long lapanganId,
      @Param("tanggal") LocalDate tanggal,
      @Param("jamMulai") LocalTime jamMulai,
      @Param("jamSelesai") LocalTime jamSelesai,
      @Param("statusBatal") BookingStatus statusBatal
  );
}

