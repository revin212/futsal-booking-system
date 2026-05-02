package com.yourorg.futsal.domain.repo;

import com.yourorg.futsal.domain.entity.AppUser;
import com.yourorg.futsal.domain.enums.UserRole;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
  Optional<AppUser> findByEmail(String email);

  @Query("""
      select u from AppUser u
      where (coalesce(:q, '') = '' or lower(u.email) like lower(concat('%', :q, '%'))
             or lower(u.namaLengkap) like lower(concat('%', :q, '%')))
        and (:role is null or u.role = :role)
        and (:blocked is null or u.isBlocked = :blocked)
      """)
  Page<AppUser> searchUsers(
      @Param("q") String q,
      @Param("role") UserRole role,
      @Param("blocked") Boolean blocked,
      Pageable pageable
  );
}

