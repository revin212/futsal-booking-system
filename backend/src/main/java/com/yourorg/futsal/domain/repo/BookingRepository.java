package com.yourorg.futsal.domain.repo;

import com.yourorg.futsal.domain.entity.Booking;
import com.yourorg.futsal.domain.enums.BookingStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
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

