package com.yourorg.futsal.web.controller;

import com.yourorg.futsal.auth.SecurityUtils;
import com.yourorg.futsal.domain.entity.AppUser;
import com.yourorg.futsal.domain.enums.UserRole;
import com.yourorg.futsal.domain.repo.AppUserRepository;
import com.yourorg.futsal.domain.repo.BookingRepository;
import com.yourorg.futsal.service.AuditLogService;
import com.yourorg.futsal.web.dto.BlockUserRequest;
import com.yourorg.futsal.web.dto.BookingResponse;
import com.yourorg.futsal.web.dto.RoleUserRequest;
import com.yourorg.futsal.web.dto.UserResponse;
import com.yourorg.futsal.web.exception.ApiException;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
  private final AppUserRepository userRepo;
  private final BookingRepository bookingRepo;
  private final AuditLogService auditLogService;

  public AdminUserController(AppUserRepository userRepo, BookingRepository bookingRepo, AuditLogService auditLogService) {
    this.userRepo = userRepo;
    this.bookingRepo = bookingRepo;
    this.auditLogService = auditLogService;
  }

  @GetMapping
  public Page<UserResponse> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) String q,
      @RequestParam(required = false) String role,
      @RequestParam(required = false) Boolean blocked
  ) {
    UserRole r = null;
    if (role != null && !role.isBlank()) {
      try {
        r = UserRole.valueOf(role.trim().toUpperCase());
      } catch (IllegalArgumentException e) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Role tidak valid.");
      }
    }
    String qq = q == null || q.isBlank() ? "" : q.trim();
    Page<AppUser> res = userRepo.searchUsers(
        qq.isEmpty() ? null : qq,
        r,
        blocked,
        PageRequest.of(page, Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt"))
    );
    return res.map(UserResponse::from);
  }

  @GetMapping("/{id}")
  public AdminUserDetailResponse detail(@PathVariable UUID id) {
    AppUser u = userRepo.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "User tidak ditemukan."));
    List<BookingResponse> bookings = bookingRepo.findByUserIdWithLapanganOrderByCreatedAtDesc(id).stream()
        .limit(10)
        .map(BookingResponse::from)
        .toList();
    return new AdminUserDetailResponse(UserResponse.from(u), bookings);
  }

  @PatchMapping("/{id}/block")
  @Transactional
  public UserResponse block(@PathVariable UUID id, @Valid @RequestBody BlockUserRequest req) {
    AppUser u = userRepo.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "User tidak ditemukan."));
    if (u.getRole() == UserRole.ADMIN && id.equals(SecurityUtils.currentUserId())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Tidak bisa memblokir diri sendiri.");
    }
    u.setBlocked(req.isBlocked());
    userRepo.save(u);
    auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "USER_BLOCK", "AppUser", id.toString(), "{\"blocked\":\"" + req.isBlocked() + "\"}");
    return UserResponse.from(u);
  }

  @PatchMapping("/{id}/role")
  @Transactional
  public UserResponse role(@PathVariable UUID id, @Valid @RequestBody RoleUserRequest req) {
    AppUser u = userRepo.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "User tidak ditemukan."));
    UserRole nr = UserRole.valueOf(req.role().trim().toUpperCase());
    if (nr != UserRole.ADMIN && nr != UserRole.USER) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Role tidak valid.");
    }
    if (id.equals(SecurityUtils.currentUserId()) && nr != UserRole.ADMIN) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Tidak bisa menurunkan role diri sendiri.");
    }
    u.setRole(nr);
    userRepo.save(u);
    auditLogService.log(SecurityUtils.currentUserId(), "ADMIN", "USER_ROLE", "AppUser", id.toString(), "{\"role\":\"" + nr.name() + "\"}");
    return UserResponse.from(u);
  }

  public record AdminUserDetailResponse(UserResponse user, List<BookingResponse> recentBookings) {}
}
